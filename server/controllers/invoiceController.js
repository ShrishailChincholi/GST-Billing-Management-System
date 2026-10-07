const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const {
  calculateInvoiceTotals,
  numberToWords,
  isInterState,
} = require('../utils/gstCalculator');

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res, next) => {
  try {
    const {
      clientId,
      invoiceDate,
      dueDate,
      items,
      notes,
      terms,
      placeOfSupply,
      isReverseCharge,
    } = req.body;

    // Get client details
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Get supplier (current user) details
    const user = req.user;

    // Determine if inter-state
    const supplierStateCode = user.address.stateCode;
    const recipientStateCode = placeOfSupply?.stateCode || client.billingAddress.stateCode;
    const interState = isInterState(supplierStateCode, recipientStateCode);

    // Calculate GST totals
    const totals = calculateInvoiceTotals(items, supplierStateCode, recipientStateCode);

    // Create invoice
    const invoice = await Invoice.create({
      invoiceNumber: '', // Will be auto-generated in pre-save hook
      invoiceDate: invoiceDate || new Date(),
      dueDate,
      client: clientId,
      clientDetails: {
        name: client.name,
        gstin: client.gstin,
        billingAddress: client.billingAddress,
        shippingAddress: client.shippingAddress,
        clientType: client.clientType,
      },
      placeOfSupply: placeOfSupply || {
        state: client.billingAddress.state,
        stateCode: client.billingAddress.stateCode,
      },
      items: totals.items,
      subTotal: totals.subTotal,
      totalDiscount: totals.totalDiscount,
      totalTaxableAmount: totals.totalTaxableAmount,
      totalCGST: totals.totalCGST,
      totalSGST: totals.totalSGST,
      totalIGST: totals.totalIGST,
      totalCess: totals.totalCess,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      amountInWords: numberToWords(totals.grandTotal),
      notes,
      terms,
      isInterState: interState,
      isReverseCharge: isReverseCharge || false,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res, next) => {
  try {
    const { status, clientId, from, to, search } = req.query;
    const query = { createdBy: req.user.id };

    if (status) query.status = status;
    if (clientId) query.client = clientId;
    if (from || to) {
      query.invoiceDate = {};
      if (from) query.invoiceDate.$gte = new Date(from);
      if (to) query.invoiceDate.$lte = new Date(to);
    }
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'clientDetails.name': { $regex: search, $options: 'i' } },
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('client', 'name gstin')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    }).populate('client', 'name gstin email phone');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({ success: false, message: 'Only draft invoices can be updated' });
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updatedInvoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Issue invoice (change status from DRAFT to ISSUED)
// @route   POST /api/invoices/:id/issue
// @access  Private
const issueInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({ success: false, message: 'Only draft invoices can be issued' });
    }

    invoice.status = 'ISSUED';
    invoice.balanceDue = invoice.grandTotal;
    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel invoice
// @route   POST /api/invoices/:id/cancel
// @access  Private
const cancelInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'Paid invoices cannot be cancelled' });
    }

    invoice.status = 'CANCELLED';
    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Record payment
// @route   POST /api/invoices/:id/payment
// @access  Private
const recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentDate, paymentMethod } = req.body;
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'DRAFT' || invoice.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot record payment for this invoice' });
    }

    invoice.amountPaid += amount;
    invoice.balanceDue = invoice.grandTotal - invoice.amountPaid;

    if (invoice.balanceDue <= 0) {
      invoice.status = 'PAID';
      invoice.paymentStatus = 'PAID';
    } else if (invoice.amountPaid > 0) {
      invoice.paymentStatus = 'PARTIAL';
      invoice.status = 'PARTIALLY_PAID';
    }

    await invoice.save();

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({ success: false, message: 'Only draft invoices can be deleted' });
    }

    await invoice.deleteOne();

    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  issueInvoice,
  cancelInvoice,
  recordPayment,
  deleteInvoice,
};