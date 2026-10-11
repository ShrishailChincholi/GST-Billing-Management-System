const Sale = require('../models/Sale');
const Product = require('../models/Product');
const {
  calculateBillTotals,
  numberToWords,
  isInterState,
} = require('../utils/gstCalculator');

// ============================================================
// @desc    Create a new sale/bill
// @route   POST /api/sales
// @access  Private
// ============================================================
const createSale = async (req, res, next) => {
  try {
    const {
      billType = 'CASH',
      items,
      customerName,
      customerPhone,
      customerGstin,
      placeOfSupply,
      paymentMode = 'CASH',
      notes = '',
    } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required',
      });
    }

    if (billType === 'GST' && !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required for GST bill',
      });
    }

    // Get supplier state from logged-in user
    const supplierStateCode = req.user.address?.stateCode || '';
    const recipientStateCode =
      placeOfSupply?.stateCode || supplierStateCode;

    const interState = isInterState(supplierStateCode, recipientStateCode);

    // Calculate GST totals
    const totals = calculateBillTotals(
      items,
      supplierStateCode,
      recipientStateCode
    );

    // Create sale
    const sale = await Sale.create({
      billType,
      billDate: new Date(),
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      customerGstin: customerGstin || '',
      placeOfSupply: placeOfSupply || {
        state: req.user.address?.state || '',
        stateCode: supplierStateCode,
      },
      items: totals.items,
      subTotal: totals.subTotal,
      totalDiscount: totals.totalDiscount,
      totalTaxableAmount: totals.totalTaxableAmount,
      totalCGST: billType === 'GST' ? totals.totalCGST : 0,
      totalSGST: billType === 'GST' ? totals.totalSGST : 0,
      totalIGST: billType === 'GST' ? totals.totalIGST : 0,
      totalCess: totals.totalCess,
      totalTax: billType === 'GST' ? totals.totalTax : 0,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      amountInWords: numberToWords(totals.grandTotal),
      paymentMode,
      paymentStatus: 'PAID',
      isInterState: interState,
      notes,
      createdBy: req.user.id,
    });

    // Update product stock
    for (const item of totals.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: sale,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
// ============================================================
const getSales = async (req, res, next) => {
  try {
    const { billType, from, to, search, page = 1, limit = 100 } = req.query;

    const query = { createdBy: req.user.id };

    if (billType) query.billType = billType;

    if (from || to) {
      query.billDate = {};
      if (from) query.billDate.$gte = new Date(from);
      if (to) query.billDate.$lte = new Date(to);
    }

    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [sales, total] = await Promise.all([
      Sale.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Sale.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: sales.length,
      total,
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
// ============================================================
const getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    res.json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Private
// ============================================================
const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    // Restore stock
    for (const item of sale.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    await sale.deleteOne();

    res.json({
      success: true,
      message: 'Sale deleted and stock restored',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// @desc    Get sales stats (dashboard)
// @route   GET /api/sales/stats
// @access  Private
// ============================================================
const getSalesStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalSales,
      todaySales,
      cashBills,
      gstBills,
      recentSales,
    ] = await Promise.all([
      Sale.find({ createdBy: userId }),
      Sale.find({
        createdBy: userId,
        billDate: { $gte: today, $lt: tomorrow },
      }),
      Sale.countDocuments({ createdBy: userId, billType: 'CASH' }),
      Sale.countDocuments({ createdBy: userId, billType: 'GST' }),
      Sale.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(5),
    ]);

    const totalRevenue = totalSales.reduce((s, x) => s + x.grandTotal, 0);
    const todayRevenue = todaySales.reduce((s, x) => s + x.grandTotal, 0);
    const totalTax = totalSales
      .filter((x) => x.billType === 'GST')
      .reduce((s, x) => s + x.totalTax, 0);

    res.json({
      success: true,
      data: {
        totalSales: totalSales.length,
        totalRevenue,
        todaySales: todaySales.length,
        todayRevenue,
        cashBills,
        gstBills,
        totalTax,
        recentSales,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  getSale,
  deleteSale,
  getSalesStats,
};