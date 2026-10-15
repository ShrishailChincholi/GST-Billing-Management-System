const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();


app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN,
      'http://localhost:3000',
      'http://localhost:5173',
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));


app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'GST POS Billing API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});


app.use(errorHandler);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS allowed: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});