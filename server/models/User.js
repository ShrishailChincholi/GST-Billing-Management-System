const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'accountant', 'viewer'],
      default: 'admin',
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
    },
    gstin: {
      type: String,
      required: [true, 'GSTIN is required'],
      uppercase: true,
      trim: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Please provide a valid GSTIN',
      ],
    },
    address: {
      street: String,
      city: String,
      state: String,
      stateCode: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    phone: String,
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
      branch: String,
    },
    logo: String,
    signature: String,
  },
  { timestamps: true }
);

// Hash password before saving (Mongoose v8 - no next callback)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);