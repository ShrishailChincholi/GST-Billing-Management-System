const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    hsnCode: {
      type: String,
      required: [true, 'HSN/SAC code is required'],
      trim: true,
    },
    unit: {
      type: String,
      default: 'PCS',
      enum: ['PCS', 'KGS', 'LTR', 'MTR', 'BOX', 'SET', 'NOS', 'SQF', 'HR', 'PKT', 'DZN'],
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: 0,
    },
    gstRate: {
      type: Number,
      required: [true, 'GST rate is required'],
      enum: [0, 0.25, 3, 5, 12, 18, 28],
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', hsnCode: 'text' });

module.exports = mongoose.model('Product', productSchema);