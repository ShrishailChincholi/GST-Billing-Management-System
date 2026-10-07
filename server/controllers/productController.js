const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

// @desc    Create new product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      hsnCode,
      unit,
      rate,
      gstRate,
      cessRate,
      stock,
    } = req.body;

    // Validation
    if (!name || !hsnCode || rate === undefined || gstRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, HSN code, rate, and GST rate are required',
      });
    }

    // Validate GST rate is one of the allowed values
    const allowedGSTRates = [0, 0.25, 3, 5, 12, 18, 28];
    if (!allowedGSTRates.includes(Number(gstRate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GST rate. Allowed: 0, 0.25, 3, 5, 12, 18, 28',
      });
    }

    const product = await Product.create({
      name,
      description,
      hsnCode,
      unit: unit || 'PCS',
      rate,
      gstRate,
      cessRate: cessRate || 0,
      stock: stock || 0,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const { search, gstRate, page = 1, limit = 100 } = req.query;

    const query = { createdBy: req.user.id };

    if (gstRate !== undefined && gstRate !== '') {
      query.gstRate = Number(gstRate);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { hsnCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Validate GST rate if being updated
    if (req.body.gstRate !== undefined) {
      const allowedGSTRates = [0, 0.25, 3, 5, 12, 18, 28];
      if (!allowedGSTRates.includes(Number(req.body.gstRate))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid GST rate',
        });
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if product is used in any invoice
    const invoiceCount = await Invoice.countDocuments({
      'items.product': product._id,
    });

    if (invoiceCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product. It is used in ${invoiceCount} invoice(s).`,
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private
const updateStock = async (req, res, next) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' | 'subtract' | 'set'

    if (quantity === undefined || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and operation are required',
      });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (operation === 'add') {
      product.stock += Number(quantity);
    } else if (operation === 'subtract') {
      product.stock = Math.max(0, product.stock - Number(quantity));
    } else if (operation === 'set') {
      product.stock = Number(quantity);
    }

    await product.save();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
const getLowStockProducts = async (req, res, next) => {
  try {
    const { threshold = 10 } = req.query;

    const products = await Product.find({
      createdBy: req.user.id,
      stock: { $lte: Number(threshold) },
    }).sort({ stock: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
};