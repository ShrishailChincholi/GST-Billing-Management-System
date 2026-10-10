const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  name: { type: String, required: true },
  description: String,
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
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    clientDetails: {
      name: String,
      gstin: String,
      billingAddress: Object,
      shippingAddress: Object,
      clientType: String,
    },
    placeOfSupply: {
      state: String,
      stateCode: String,
    },
    items: [invoiceItemSchema],
    subTotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalTaxableAmount: { type: Number, required: true },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    totalCess: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountInWords: { type: String, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'],
      default: 'DRAFT',
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'PAID'],
      default: 'UNPAID',
    },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    notes: String,
    terms: String,
    isInterState: { type: Boolean, default: false },
    isReverseCharge: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Generate invoice number before saving

invoiceSchema.pre('save', async function () {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);