import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Receipt,
  Banknote,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Check,
  Printer,
  Save,
  Package,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { printBill, downloadBillPDF } from '../utils/billPDF';

const PAYMENT_MODES = ['CASH', 'UPI', 'CARD', 'NETBANKING', 'CREDIT'];

const NewBill = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ===== State =====
  const [billType, setBillType] = useState('CASH');
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    gstin: '',
  });

  const [paymentMode, setPaymentMode] = useState('CASH');
  const [showSuccess, setShowSuccess] = useState(null);

  // ===== Load products =====
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // ===== Filtered products =====
  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.hsnCode.toLowerCase().includes(q)
    );
  }, [search, products]);

  // ===== Cart operations =====
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        return prev.map((i) =>
          i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          _id: product._id,
          name: product.name,
          hsnCode: product.hsnCode,
          unit: product.unit,
          rate: product.rate,
          gstRate: product.gstRate,
          cessRate: product.cessRate || 0,
          quantity: 1,
          discount: 0,
        },
      ];
    });
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    setCart((prev) =>
      prev.map((i) => (i._id === id ? { ...i, quantity: newQty } : i))
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i._id !== id));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from the bill?')) {
      setCart([]);
    }
  };

  // ===== Totals (auto-updates) =====
  const totals = useMemo(() => {
    let subTotal = 0;
    let taxableAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalCess = 0;
    let totalDiscount = 0;

    cart.forEach((item) => {
      const lineGross = item.quantity * item.rate;
      const lineDiscount = item.discount || 0;
      const lineTaxable = lineGross - lineDiscount;

      subTotal += lineGross;
      totalDiscount += lineDiscount;
      taxableAmount += lineTaxable;

      const gstAmount = (lineTaxable * item.gstRate) / 100;
      totalCGST += gstAmount / 2;
      totalSGST += gstAmount / 2;
      totalCess += (lineTaxable * item.cessRate) / 100;
    });

    const grandTotal =
      taxableAmount + totalCGST + totalSGST + totalIGST + totalCess;
    const roundedTotal = Math.round(grandTotal);
    const roundOff = roundedTotal - grandTotal;

    return {
      subTotal,
      totalDiscount,
      taxableAmount,
      totalCGST,
      totalSGST,
      totalIGST,
      totalCess,
      totalTax: totalCGST + totalSGST + totalIGST + totalCess,
      grandTotal: roundedTotal,
      roundOff,
    };
  }, [cart]);

  // ===== Generate Bill =====
  const handleGenerateBill = async () => {
    if (cart.length === 0) {
      toast.error('Add at least one product to the bill');
      return;
    }

    if (billType === 'GST' && !customer.name.trim()) {
      toast.error('Customer name is required for GST bill');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        billType,
        customerName: customer.name || 'Walk-in Customer',
        customerPhone: customer.phone || '',
        customerGstin: billType === 'GST' ? customer.gstin || '' : '',
        paymentMode,
        items: cart.map((item) => ({
          product: item._id,
          name: item.name,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discount: item.discount || 0,
          gstRate: billType === 'GST' ? item.gstRate : 0,
          cessRate: 0,
        })),
        notes: billType === 'CASH' ? 'Cash Bill' : 'GST Tax Invoice',
      };

      const { data } = await api.post('/sales', payload);

      setShowSuccess({
        ...data.data,
        billType,
      });

      toast.success('Bill generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to generate bill');
    } finally {
      setSaving(false);
    }
  };

  const handleNewBill = () => {
    setCart([]);
    setCustomer({ name: '', phone: '', gstin: '' });
    setShowSuccess(null);
    setSearch('');
    setPaymentMode('CASH');
  };

  const handlePrintBill = () => {
    if (!showSuccess) return;
    printBill(showSuccess, user, billType);
  };

  const handleDownloadBill = () => {
    if (!showSuccess) return;
    downloadBillPDF(showSuccess, user, billType);
  };

  // ===== Success Modal =====
  if (showSuccess) {
    return (
      <>
        <Header title="Bill Generated" />
        <div className="page-content">
          <div className="page-content-inner">
            <div
              className="modal-backdrop"
              style={{ position: 'static', background: 'transparent' }}
            >
              <div className="modal" style={{ maxWidth: 480 }}>
                <div className="sale-success-modal">
                  <div className="sale-success-icon">
                    <Check size={40} />
                  </div>
                  <h2>Bill Generated!</h2>
                  <p>
                    {showSuccess.billType === 'GST'
                      ? 'GST Tax Invoice'
                      : 'Cash Bill'}{' '}
                    · {showSuccess.billNumber}
                  </p>
                  <div className="sale-success-amount">
                    {formatCurrency(showSuccess.grandTotal)}
                  </div>
                  <div className="sale-success-actions">
                    <button
                      onClick={handlePrintBill}
                      className="btn btn-secondary"
                    >
                      <Printer size={16} /> Print
                    </button>
                    <button
                      onClick={handleDownloadBill}
                      className="btn btn-secondary"
                    >
                      <Save size={16} /> Download PDF
                    </button>
                    <button onClick={handleNewBill} className="btn btn-primary">
                      <Plus size={16} /> New Bill
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===== Main POS UI =====
  return (
    <>
      <Header title="New Bill" />
      <div className="page-content">
        <div className="page-content-inner">
          {/* ===== Bill Type Selector ===== */}
          <div className="bill-type-selector">
            <button
              type="button"
              onClick={() => setBillType('CASH')}
              className={`bill-type-option cash${
                billType === 'CASH' ? ' active' : ''
              }`}
            >
              <div className="bill-type-option-icon">
                <Banknote size={24} />
              </div>
              <div>
                <p className="bill-type-option-title">Cash Bill</p>
                <p className="bill-type-option-desc">
                  Quick sale, no GST breakdown (walk-in customers)
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBillType('GST')}
              className={`bill-type-option gst${
                billType === 'GST' ? ' active' : ''
              }`}
            >
              <div className="bill-type-option-icon">
                <Receipt size={24} />
              </div>
              <div>
                <p className="bill-type-option-title">GST Bill</p>
                <p className="bill-type-option-desc">
                  Tax invoice with customer GSTIN & CGST/SGST breakdown
                </p>
              </div>
            </button>
          </div>

          {/* ===== POS Layout ===== */}
          <div className="pos-layout">
            {/* LEFT: Products + Customer Info */}
            <div>
              {/* Customer Info */}
              <div className="customer-panel">
                <p className="customer-panel-title">
                  {billType === 'GST'
                    ? 'Customer Details (Required)'
                    : 'Customer Details (Optional)'}
                </p>
                <div className="invoice-form-row two-col">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Customer Name</label>
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) =>
                        setCustomer({ ...customer, name: e.target.value })
                      }
                      className="input-field"
                      placeholder={
                        billType === 'GST' ? 'ABC Traders' : 'Walk-in Customer'
                      }
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer({ ...customer, phone: e.target.value })
                      }
                      className="input-field"
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
                </div>

                {billType === 'GST' && (
                  <div
                    className="form-group"
                    style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}
                  >
                    <label className="label">Customer GSTIN</label>
                    <input
                      type="text"
                      value={customer.gstin}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          gstin: e.target.value.toUpperCase(),
                        })
                      }
                      className="input-field"
                      placeholder="29AABCT1332L1Z8"
                      maxLength={15}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                )}
              </div>

              {/* Product Picker */}
              <div className="product-picker">
                <div className="product-picker-search">
                  <Search size={16} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products by name or HSN..."
                  />
                </div>

                {loading ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="cart-empty" style={{ padding: 40 }}>
                    <Package size={40} />
                    <p>No products found</p>
                  </div>
                ) : (
                  <div className="product-grid">
                    {filteredProducts.map((product) => (
                      <button
                        key={product._id}
                        type="button"
                        onClick={() => addToCart(product)}
                        className="product-card"
                        disabled={product.stock <= 0}
                      >
                        <p className="product-card-name">{product.name}</p>
                        <div className="product-card-meta">
                          <span className="product-card-price">
                            {formatCurrency(product.rate, false)}
                          </span>
                          <span className="product-card-gst">
                            {product.gstRate}%
                          </span>
                        </div>
                        <span
                          className={`product-card-stock${
                            product.stock <= 5 ? ' low' : ''
                          }`}
                        >
                          Stock: {product.stock} {product.unit}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Cart + Summary + Actions */}
            <div className="cart-panel">
              <div className="cart-header">
                <h3>
                  <ShoppingCart size={18} />
                  Cart
                  {cart.length > 0 && (
                    <span className="cart-badge">{cart.length}</span>
                  )}
                </h3>
                {cart.length > 0 && (
                  <button onClick={clearCart} className="cart-clear-btn">
                    Clear all
                  </button>
                )}
              </div>

              {/* Cart Items */}
              <div className="cart-items">
                {cart.length === 0 ? (
                  <div className="cart-empty">
                    <ShoppingCart size={40} />
                    <p>Cart is empty. Add products from the left.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item._id} className="cart-item">
                      <div className="cart-item-info">
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-price">
                          {formatCurrency(item.rate, false)} × {item.quantity} ={' '}
                          {formatCurrency(item.rate * item.quantity, false)}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 6,
                          }}
                        >
                          <div className="qty-control">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item._id, item.quantity - 1)
                              }
                              className="qty-btn"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="qty-value">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item._id, item.quantity + 1)
                              }
                              className="qty-btn"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div className="cart-item-total">
                          {formatCurrency(
                            item.rate * item.quantity - (item.discount || 0),
                            false
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="cart-item-remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bill Summary */}
              {cart.length > 0 && (
                <div className="bill-summary">
                  <div className="bill-summary-row">
                    <span className="bill-summary-row-label">Sub Total</span>
                    <span className="bill-summary-row-value">
                      {formatCurrency(totals.subTotal)}
                    </span>
                  </div>

                  {billType === 'GST' && (
                    <>
                      <div className="bill-summary-row">
                        <span className="bill-summary-row-label">CGST</span>
                        <span className="bill-summary-row-value">
                          {formatCurrency(totals.totalCGST)}
                        </span>
                      </div>
                      <div className="bill-summary-row">
                        <span className="bill-summary-row-label">SGST</span>
                        <span className="bill-summary-row-value">
                          {formatCurrency(totals.totalSGST)}
                        </span>
                      </div>
                    </>
                  )}

                  {totals.roundOff !== 0 && (
                    <div className="bill-summary-row">
                      <span className="bill-summary-row-label">Round Off</span>
                      <span className="bill-summary-row-value">
                        {totals.roundOff > 0 ? '+' : ''}
                        {totals.roundOff.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="bill-summary-row total">
                    <span className="bill-summary-row-label">Grand Total</span>
                    <span className="bill-summary-row-value">
                      {formatCurrency(totals.grandTotal)}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Mode */}
              {cart.length > 0 && (
                <div style={{ padding: 'var(--space-4) var(--space-5) 0' }}>
                  <p
                    className="customer-panel-title"
                    style={{ marginBottom: 8 }}
                  >
                    Payment Mode
                  </p>
                  <div className="payment-modes">
                    {PAYMENT_MODES.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`payment-mode${
                          paymentMode === mode ? ' active' : ''
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bill-actions">
                <button
                  type="button"
                  onClick={handleGenerateBill}
                  disabled={saving || cart.length === 0}
                  className="btn btn-primary btn-lg w-full"
                >
                  {saving ? (
                    'Generating...'
                  ) : (
                    <>
                      <Check size={18} /> Generate & Print Bill
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewBill;