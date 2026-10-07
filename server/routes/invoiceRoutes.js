const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  issueInvoice,
  cancelInvoice,
  recordPayment,
  deleteInvoice,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getInvoices).post(createInvoice);
router.route('/:id').get(getInvoice).put(updateInvoice).delete(deleteInvoice);
router.post('/:id/issue', issueInvoice);
router.post('/:id/cancel', cancelInvoice);
router.post('/:id/payment', recordPayment);

module.exports = router;