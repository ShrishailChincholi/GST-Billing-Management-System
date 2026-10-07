const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    gstin: {
      type: String,
      uppercase: true,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: String,
    billingAddress: {
      street: String,
      city: String,
      state: String,
      stateCode: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      stateCode: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    clientType: {
      type: String,
      enum: ['B2B', 'B2C', 'SEZ', 'Export'],
      default: 'B2B',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);