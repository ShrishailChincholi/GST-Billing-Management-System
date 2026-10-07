const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Product = require('../models/Product');

/**
 * Helper: Get date range for a given period
 */
const getDateRange = (period, from, to) => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      endDate = new Date();
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
      break;
    }
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case 'custom':
      startDate = new Date(from);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date();
  }

  return { startDate, endDate };
};

// @desc    Get GSTR-1 Report (Outward Supplies)
// @route   GET /api/reports/gstr1
// @access  Private
const getGSTR1Report = async (req, res, next) => {
  try {
    const { period = 'month', from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);

    const invoices = await Invoice.find({
      createdBy: req.user.id,
      status: { $in: ['ISSUED', 'PAID', 'PARTIALLY_PAID'] },
      invoiceDate: { $gte: startDate, $lte: endDate },
    }).populate('client', 'name gstin clientType billingAddress');

    // B2B Invoices (with GSTIN)
    const b2bInvoices = invoices.filter(
      (inv) => inv.clientDetails?.gstin && inv.clientDetails.gstin.trim() !== ''
    );

    // B2C Invoices (without GSTIN)
    const b2cInvoices = invoices.filter(
      (inv) => !inv.clientDetails?.gstin || inv.clientDetails.gstin.trim() === ''
    );

    // HSN Summary
    const hsnMap = {};
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const key = item.hsnCode;
        if (!hsnMap[key]) {
          hsnMap[key] = {
            hsnCode: item.hsnCode,
            description: item.name,
            uqc: item.unit || 'PCS',
            quantity: 0,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            cess: 0,
            totalValue: 0,
          };
        }
        hsnMap[key].quantity += item.quantity;
        hsnMap[key].taxableValue += item.taxableAmount;
        hsnMap[key].cgst += item.cgstAmount;
        hsnMap[key].sgst += item.sgstAmount;
        hsnMap[key].igst += item.igstAmount;
        hsnMap[key].cess += item.cessAmount;
        hsnMap[key].totalValue += item.totalAmount;
      });
    });

    // B2B Summary (Invoice-level with tax rate breakdown)
    const b2bSummary = b2bInvoices.map((inv) => ({
      gstin: inv.clientDetails.gstin,
      receiverName: inv.clientDetails.name,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      invoiceValue: inv.grandTotal,
      placeOfSupply: inv.placeOfSupply?.stateCode || '',
      reverseCharge: inv.isReverseCharge ? 'Y' : 'N',
      applicableTaxRate: inv.items[0]?.gstRate || 0,
      invoiceType: inv.isInterState ? 'Inter-State' : 'Intra-State',
      ecommerceGSTIN: '',
      rate: inv.items[0]?.gstRate || 0,
      taxableValue: inv.totalTaxableAmount,
      cessAmount: inv.totalCess,
    }));

    // B2C Summary (Rate-wise)
    const b2cSummary = b2cInvoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      placeOfSupply: inv.placeOfSupply?.stateCode || '',
      applicableTaxRate: inv.items[0]?.gstRate || 0,
      invoiceValue: inv.grandTotal,
      taxableValue: inv.totalTaxableAmount,
      cgst: inv.totalCGST,
      sgst: inv.totalSGST,
      igst: inv.totalIGST,
      cess: inv.totalCess,
    }));

    // Document Summary
    const docSummary = [
      {
        natureOfDocument: 'Invoices for outward supply',
        srNoFrom: invoices[0]?.invoiceNumber || '-',
        srNoTo: invoices[invoices.length - 1]?.invoiceNumber || '-',
        totalNumber: invoices.length,
        cancelled: invoices.filter((i) => i.status === 'CANCELLED').length,
        netIssued: invoices.filter((i) => i.status !== 'CANCELLED').length,
      },
    ];

    // Totals
    const totals = {
      totalInvoices: invoices.length,
      b2bCount: b2bInvoices.length,
      b2cCount: b2cInvoices.length,
      totalTaxableValue: invoices.reduce((s, i) => s + i.totalTaxableAmount, 0),
      totalCGST: invoices.reduce((s, i) => s + i.totalCGST, 0),
      totalSGST: invoices.reduce((s, i) => s + i.totalSGST, 0),
      totalIGST: invoices.reduce((s, i) => s + i.totalIGST, 0),
      totalCess: invoices.reduce((s, i) => s + i.totalCess, 0),
      totalInvoiceValue: invoices.reduce((s, i) => s + i.grandTotal, 0),
    };

    res.json({
      success: true,
      period: { from: startDate, to: endDate },
      data: {
        b2b: b2bSummary,
        b2c: b2cSummary,
        hsnSummary: Object.values(hsnMap),
        docSummary,
        totals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get GSTR-3B Report (Monthly Summary)
// @route   GET /api/reports/gstr3b
// @access  Private
const getGSTR3BReport = async (req, res, next) => {
  try {
    const { period = 'month', from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);

    const invoices = await Invoice.find({
      createdBy: req.user.id,
      status: { $in: ['ISSUED', 'PAID', 'PARTIALLY_PAID'] },
      invoiceDate: { $gte: startDate, $lte: endDate },
    });

    // Section 3.1 - Outward supplies
    const outwardSupplies = {
      taxableValue: invoices.reduce((s, i) => s + i.totalTaxableAmount, 0),
      igst: invoices.reduce((s, i) => s + i.totalIGST, 0),
      cgst: invoices.reduce((s, i) => s + i.totalCGST, 0),
      sgst: invoices.reduce((s, i) => s + i.totalSGST, 0),
      cess: invoices.reduce((s, i) => s + i.totalCess, 0),
    };

    // Inter-state vs intra-state breakdown
    const interState = invoices.filter((i) => i.isInterState);
    const intraState = invoices.filter((i) => !i.isInterState);

    const section31 = {
      // 3.1(a) Outward taxable supplies (other than zero-rated, nil-rated, exempted)
      outwardTaxableSupplies: {
        taxableValue: outwardSupplies.taxableValue,
        igst: outwardSupplies.igst,
        cgst: outwardSupplies.cgst,
        sgst: outwardSupplies.sgst,
        cess: outwardSupplies.cess,
      },
      // 3.1(b) Outward taxable supplies (zero-rated)
      outwardZeroRated: {
        taxableValue: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        cess: 0,
      },
      // 3.1(c) Other outward supplies (nil-rated, exempted)
      outwardNilExempt: {
        taxableValue: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        cess: 0,
      },
      // 3.1(d) Inward supplies (reverse charge)
      inwardReverseCharge: {
        taxableValue: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        cess: 0,
      },
      // 3.1(e) Non-GST outward supplies
      nonGSTOutward: {
        taxableValue: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        cess: 0,
      },
    };

    // Section 4 - Eligible ITC (placeholder - requires purchase data)
    const itcDetails = {
      allOtherITC: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
      ISD: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
      reversal: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
      ineligibleITC: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
    };

    // Net tax payable
    const netTaxPayable = {
      igst: outwardSupplies.igst,
      cgst: outwardSupplies.cgst,
      sgst: outwardSupplies.sgst,
      cess: outwardSupplies.cess,
    };

    // Breakdown
    const breakdown = {
      interState: {
        count: interState.length,
        taxableValue: interState.reduce((s, i) => s + i.totalTaxableAmount, 0),
        igst: interState.reduce((s, i) => s + i.totalIGST, 0),
        invoiceValue: interState.reduce((s, i) => s + i.grandTotal, 0),
      },
      intraState: {
        count: intraState.length,
        taxableValue: intraState.reduce((s, i) => s + i.totalTaxableAmount, 0),
        cgst: intraState.reduce((s, i) => s + i.totalCGST, 0),
        sgst: intraState.reduce((s, i) => s + i.totalSGST, 0),
        invoiceValue: intraState.reduce((s, i) => s + i.grandTotal, 0),
      },
    };

    res.json({
      success: true,
      period: { from: startDate, to: endDate },
      data: {
        section31,
        itcDetails,
        netTaxPayable,
        breakdown,
        totals: outwardSupplies,
        totalInvoices: invoices.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Sales Summary Report
// @route   GET /api/reports/sales-summary
// @access  Private
const getSalesSummary = async (req, res, next) => {
  try {
    const { period = 'month', from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);

    const invoices = await Invoice.find({
      createdBy: req.user.id,
      status: { $in: ['ISSUED', 'PAID', 'PARTIALLY_PAID'] },
      invoiceDate: { $gte: startDate, $lte: endDate },
    });

    // Daily breakdown
    const dailyMap = {};
    invoices.forEach((inv) => {
      const dateKey = new Date(inv.invoiceDate).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          count: 0,
          taxableValue: 0,
          tax: 0,
          total: 0,
        };
      }
      dailyMap[dateKey].count += 1;
      dailyMap[dateKey].taxableValue += inv.totalTaxableAmount;
      dailyMap[dateKey].tax += inv.totalCGST + inv.totalSGST + inv.totalIGST + inv.totalCess;
      dailyMap[dateKey].total += inv.grandTotal;
    });

    // Status-wise breakdown
    const statusMap = {};
    invoices.forEach((inv) => {
      if (!statusMap[inv.status]) {
        statusMap[inv.status] = { count: 0, amount: 0 };
      }
      statusMap[inv.status].count += 1;
      statusMap[inv.status].amount += inv.grandTotal;
    });

    // Top clients
    const clientMap = {};
    invoices.forEach((inv) => {
      const clientName = inv.clientDetails?.name || 'Unknown';
      if (!clientMap[clientName]) {
        clientMap[clientName] = {
          name: clientName,
          gstin: inv.clientDetails?.gstin || '',
          count: 0,
          total: 0,
        };
      }
      clientMap[clientName].count += 1;
      clientMap[clientName].total += inv.grandTotal;
    });

    const topClients = Object.values(clientMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    res.json({
      success: true,
      period: { from: startDate, to: endDate },
      data: {
        dailyBreakdown: Object.values(dailyMap).sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
        statusBreakdown: Object.entries(statusMap).map(([status, data]) => ({
          status,
          ...data,
        })),
        topClients,
        summary: {
          totalInvoices: invoices.length,
          totalTaxableValue: invoices.reduce((s, i) => s + i.totalTaxableAmount, 0),
          totalTax: invoices.reduce(
            (s, i) => s + i.totalCGST + i.totalSGST + i.totalIGST + i.totalCess,
            0
          ),
          totalRevenue: invoices.reduce((s, i) => s + i.grandTotal, 0),
          totalPaid: invoices.reduce((s, i) => s + i.amountPaid, 0),
          totalPending: invoices.reduce((s, i) => s + i.balanceDue, 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Tax Liability Report
// @route   GET /api/reports/tax-liability
// @access  Private
const getTaxLiability = async (req, res, next) => {
  try {
    const { period = 'month', from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);

    const invoices = await Invoice.find({
      createdBy: req.user.id,
      status: { $in: ['ISSUED', 'PAID', 'PARTIALLY_PAID'] },
      invoiceDate: { $gte: startDate, $lte: endDate },
    });

    // Rate-wise breakdown
    const rateMap = {};
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const rate = item.gstRate;
        if (!rateMap[rate]) {
          rateMap[rate] = {
            rate,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            cess: 0,
            total: 0,
          };
        }
        rateMap[rate].taxableValue += item.taxableAmount;
        rateMap[rate].cgst += item.cgstAmount;
        rateMap[rate].sgst += item.sgstAmount;
        rateMap[rate].igst += item.igstAmount;
        rateMap[rate].cess += item.cessAmount;
        rateMap[rate].total += item.totalAmount;
      });
    });

    // State-wise (place of supply) breakdown
    const stateMap = {};
    invoices.forEach((inv) => {
      const state = inv.placeOfSupply?.state || 'Unknown';
      if (!stateMap[state]) {
        stateMap[state] = {
          state,
          stateCode: inv.placeOfSupply?.stateCode || '',
          count: 0,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          total: 0,
        };
      }
      stateMap[state].count += 1;
      stateMap[state].taxableValue += inv.totalTaxableAmount;
      stateMap[state].cgst += inv.totalCGST;
      stateMap[state].sgst += inv.totalSGST;
      stateMap[state].igst += inv.totalIGST;
      stateMap[state].total += inv.grandTotal;
    });

    const totals = {
      taxableValue: invoices.reduce((s, i) => s + i.totalTaxableAmount, 0),
      cgst: invoices.reduce((s, i) => s + i.totalCGST, 0),
      sgst: invoices.reduce((s, i) => s + i.totalSGST, 0),
      igst: invoices.reduce((s, i) => s + i.totalIGST, 0),
      cess: invoices.reduce((s, i) => s + i.totalCess, 0),
    };

    totals.totalTax = totals.cgst + totals.sgst + totals.igst + totals.cess;

    res.json({
      success: true,
      period: { from: startDate, to: endDate },
      data: {
        rateWise: Object.values(rateMap).sort((a, b) => a.rate - b.rate),
        stateWise: Object.values(stateMap).sort((a, b) => b.total - a.total),
        totals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Client-wise Sales Report
// @route   GET /api/reports/client-wise
// @access  Private
const getClientWiseSales = async (req, res, next) => {
  try {
    const { period = 'year', from, to } = req.query;
    const { startDate, endDate } = getDateRange(period, from, to);

    const result = await Invoice.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          status: { $in: ['ISSUED', 'PAID', 'PARTIALLY_PAID'] },
          invoiceDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$client',
          clientName: { $first: '$clientDetails.name' },
          gstin: { $first: '$clientDetails.gstin' },
          clientType: { $first: '$clientDetails.clientType' },
          totalInvoices: { $sum: 1 },
          totalTaxableValue: { $sum: '$totalTaxableAmount' },
          totalCGST: { $sum: '$totalCGST' },
          totalSGST: { $sum: '$totalSGST' },
          totalIGST: { $sum: '$totalIGST' },
          totalAmount: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$amountPaid' },
          totalPending: { $sum: '$balanceDue' },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const totals = result.reduce(
      (acc, client) => ({
        totalInvoices: acc.totalInvoices + client.totalInvoices,
        totalTaxableValue: acc.totalTaxableValue + client.totalTaxableValue,
        totalCGST: acc.totalCGST + client.totalCGST,
        totalSGST: acc.totalSGST + client.totalSGST,
        totalIGST: acc.totalIGST + client.totalIGST,
        totalAmount: acc.totalAmount + client.totalAmount,
        totalPaid: acc.totalPaid + client.totalPaid,
        totalPending: acc.totalPending + client.totalPending,
      }),
      {
        totalInvoices: 0,
        totalTaxableValue: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalPending: 0,
      }
    );

    res.json({
      success: true,
      period: { from: startDate, to: endDate },
      count: result.length,
      data: result,
      totals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Dashboard Stats
// @route   GET /api/reports/dashboard-stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get current month range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // All-time stats
    const [
      allInvoices,
      monthInvoices,
      totalClients,
      totalProducts,
      recentInvoices,
    ] = await Promise.all([
      Invoice.find({ createdBy: userId }),
      Invoice.find({
        createdBy: userId,
        invoiceDate: { $gte: monthStart, $lte: monthEnd },
      }),
      Client.countDocuments({ createdBy: userId }),
      Product.countDocuments({ createdBy: userId }),
      Invoice.find({ createdBy: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('client', 'name'),
    ]);

    // Calculate stats
    const totalRevenue = allInvoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.grandTotal, 0);

    const monthRevenue = monthInvoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.grandTotal, 0);

    const pendingAmount = allInvoices
      .filter((inv) => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.balanceDue, 0);

    const overdueCount = allInvoices.filter((inv) => {
      return (
        inv.status === 'ISSUED' &&
        new Date(inv.dueDate) < new Date() &&
        inv.balanceDue > 0
      );
    }).length;

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthInvs = allInvoices.filter(
        (inv) =>
          new Date(inv.invoiceDate) >= start && new Date(inv.invoiceDate) <= end
      );

      monthlyTrend.push({
        month: start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        revenue: monthInvs.reduce((s, i) => s + i.grandTotal, 0),
        invoiceCount: monthInvs.length,
      });
    }

    // Status breakdown
    const statusBreakdown = ['DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'].map(
      (status) => ({
        status,
        count: allInvoices.filter((inv) => inv.status === status).length,
        amount: allInvoices
          .filter((inv) => inv.status === status)
          .reduce((s, i) => s + i.grandTotal, 0),
      })
    );

    // GST Breakdown (current month)
    const gstBreakdown = {
      cgst: monthInvoices.reduce((s, i) => s + i.totalCGST, 0),
      sgst: monthInvoices.reduce((s, i) => s + i.totalSGST, 0),
      igst: monthInvoices.reduce((s, i) => s + i.totalIGST, 0),
      cess: monthInvoices.reduce((s, i) => s + i.totalCess, 0),
    };

    res.json({
      success: true,
      data: {
        totalRevenue,
        monthRevenue,
        pendingAmount,
        totalInvoices: allInvoices.length,
        monthInvoices: monthInvoices.length,
        totalClients,
        totalProducts,
        overdueCount,
        monthlyTrend,
        statusBreakdown,
        gstBreakdown,
        recentInvoices,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGSTR1Report,
  getGSTR3BReport,
  getSalesSummary,
  getTaxLiability,
  getClientWiseSales,
  getDashboardStats,
};