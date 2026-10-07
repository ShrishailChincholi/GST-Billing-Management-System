const express = require('express');
const router = express.Router();
const {
  getGSTR1Report,
  getGSTR3BReport,
  getSalesSummary,
  getTaxLiability,
  getClientWiseSales,
  getDashboardStats,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GST Returns
router.get('/gstr1', getGSTR1Report);
router.get('/gstr3b', getGSTR3BReport);

// Analytics Reports
router.get('/sales-summary', getSalesSummary);
router.get('/tax-liability', getTaxLiability);
router.get('/client-wise', getClientWiseSales);

// Dashboard
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;