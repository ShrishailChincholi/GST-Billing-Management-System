const mongoose = require('mongoose');

// ============================================================
// Sale Item Schema
// ============================================================
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
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
  },
  { _id: false }
);

// ============================================================
// Sale Schema
// ============================================================
const saleSchema = new mongoose.Schema(
  {
    // ===== Bill Info =====
    // NOT required — generated in the controller before creation
    billNumber: {
      type: String,
      unique: true,
      sparse: true, // allows docs without billNumber during creation
      trim: true,
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

    // ===== Customer Info =====
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

    // ===== Place of Supply =====
    placeOfSupply: {
      state: { type: String, default: '' },
      stateCode: { type: String, default: '' },
    },

    // ===== Items =====
    items: [saleItemSchema],

    // ===== Totals =====
    subTotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalTaxableAmount: { type: Number, required: true },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountInWords: { type: String, required: true },

    // ===== Payment =====
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

    // ===== Metadata =====
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

// No pre-save hook — bill number is generated in the controller

module.exports = mongoose.model('Sale', saleSchema);