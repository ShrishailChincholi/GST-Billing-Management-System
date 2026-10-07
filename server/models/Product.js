const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: String,
    hsnCode: {
      type: String,
      required: [true, 'HSN/SAC code is required'],
      trim: true,
    },
    unit: {
      type: String,
      default: 'PCS',
      enum: ['PCS', 'KGS', 'LTR', 'MTR', 'BOX', 'SET', 'NOS', 'SQF', 'HR'],
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
    cessRate: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);