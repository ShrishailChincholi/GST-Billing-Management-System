const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSale,
  deleteSale,
  getSalesStats,
} = require('../controllers/saleController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Stats (must be before /:id)
router.get('/stats', getSalesStats);

router.route('/').get(getSales).post(createSale);
router.route('/:id').get(getSale).delete(deleteSale);

module.exports = router;