const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Special routes (must come before /:id)
router.get('/low-stock', getLowStockProducts);

router.route('/').get(getProducts).post(createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(updateProduct)
  .delete(deleteProduct);

router.patch('/:id/stock', updateStock);

module.exports = router;