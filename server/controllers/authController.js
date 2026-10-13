const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// ============================================================
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// ============================================================
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      businessName,
      gstin,
      address,
      phone,
    } = req.body;

    // Validation
    if (!name || !email || !password || !businessName || !gstin) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      businessName,
      gstin,
      address: address || {},
      phone: phone || '',
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        gstin: user.gstin,
        role: user.role,
        address: user.address,
        phone: user.phone,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ============================================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        gstin: user.gstin,
        role: user.role,
        address: user.address,
        phone: user.phone,
        bankDetails: user.bankDetails,
        billFooterNote: user.billFooterNote,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};


const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};


const updateProfile = async (req, res, next) => {
  try {
    const { name, businessName, gstin, address, phone, bankDetails, billFooterNote } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        businessName,
        gstin,
        address,
        phone,
        bankDetails,
        billFooterNote,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile };