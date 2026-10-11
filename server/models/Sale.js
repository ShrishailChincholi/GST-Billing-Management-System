const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    name: { type: String, required: true },
    hsnCode: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, default: 'PCS' },
    rate: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    gstRate: { type: Number, required: true },
    cgstRate: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    cessRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    cessAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    // Bill Info
    billNumber: {
      type: String,
      required: true,
      unique: true,
    },
    billType: {
      type: String,
      enum: ['GST', 'CASH'],
      default: 'CASH',
      required: true,
    },
    billDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Customer Info (optional for cash bills)
    customerName: {
      type: String,
      default: 'Walk-in Customer',
      trim: true,
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    customerGstin: {
      type: String,
      default: '',
      uppercase: true,
      trim: true,
    },

    // Place of Supply (for GST calc)
    placeOfSupply: {
      state: { type: String, default: '' },
      stateCode: { type: String, default: '' },
    },

    // Items
    items: [saleItemSchema],

    // Totals
    subTotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalTaxableAmount: { type: Number, required: true },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    totalCess: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountInWords: { type: String, required: true },

    // Payment
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'NETBANKING', 'CREDIT'],
      default: 'CASH',
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING'],
      default: 'PAID',
    },

    // Metadata
    isInterState: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-generate bill number before save (Mongoose v8 - no next callback)
saleSchema.pre('save', async function () {
  if (!this.billNumber) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Sale').countDocuments();
    const prefix = this.billType === 'CASH' ? 'CB' : 'GST';
    this.billNumber = `${prefix}-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('Sale', saleSchema);