const Client = require('../models/Client');
const Invoice = require('../models/Invoice');

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
const createClient = async (req, res, next) => {
  try {
    const {
      name,
      gstin,
      email,
      phone,
      billingAddress,
      shippingAddress,
      clientType,
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Client name is required',
      });
    }

    // Check for duplicate GSTIN (if provided)
    if (gstin) {
      const existing = await Client.findOne({
        gstin: gstin.toUpperCase(),
        createdBy: req.user.id,
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A client with this GSTIN already exists',
        });
      }
    }

    const client = await Client.create({
      name,
      gstin: gstin ? gstin.toUpperCase() : undefined,
      email,
      phone,
      billingAddress,
      shippingAddress: shippingAddress || billingAddress,
      clientType: clientType || 'B2B',
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
const getClients = async (req, res, next) => {
  try {
    const { search, clientType, page = 1, limit = 100 } = req.query;

    const query = { createdBy: req.user.id };

    if (clientType) {
      query.clientType = clientType;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [clients, total] = await Promise.all([
      Client.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Client.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: clients.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: clients,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single client by ID
// @route   GET /api/clients/:id
// @access  Private
const getClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Get client's invoice stats
    const invoiceStats = await Invoice.aggregate([
      {
        $match: {
          client: client._id,
          createdBy: req.user._id,
        },
      },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalBilled: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$amountPaid' },
          totalPending: { $sum: '$balanceDue' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        ...client.toObject(),
        stats: invoiceStats[0] || {
          totalInvoices: 0,
          totalBilled: 0,
          totalPaid: 0,
          totalPending: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = async (req, res, next) => {
  try {
    let client = await Client.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // If GSTIN is being changed, check for duplicates
    if (req.body.gstin && req.body.gstin.toUpperCase() !== client.gstin) {
      const existing = await Client.findOne({
        gstin: req.body.gstin.toUpperCase(),
        createdBy: req.user.id,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'A client with this GSTIN already exists',
        });
      }
      req.body.gstin = req.body.gstin.toUpperCase();
    }

    client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Check if client has any invoices
    const invoiceCount = await Invoice.countDocuments({ client: client._id });

    if (invoiceCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete client. ${invoiceCount} invoice(s) are associated with this client.`,
      });
    }

    await client.deleteOne();

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client invoice list
// @route   GET /api/clients/:id/invoices
// @access  Private
const getClientInvoices = async (req, res, next) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    const invoices = await Invoice.find({
      client: client._id,
      createdBy: req.user.id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  getClientInvoices,
};