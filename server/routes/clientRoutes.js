const express = require('express');
const router = express.Router();
const {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  getClientInvoices,
} = require('../controllers/clientController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/').get(getClients).post(createClient);

router
  .route('/:id')
  .get(getClient)
  .put(updateClient)
  .delete(deleteClient);

router.get('/:id/invoices', getClientInvoices);

module.exports = router;