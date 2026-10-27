import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from '../components/Layout/Header';
import BillTypeSelector from '../components/Billing/BillTypeSelector';
import CustomerForm from '../components/Billing/CustomerForm';
import ProductPicker from '../components/Billing/ProductPicker';
import CartPanel from '../components/Billing/CartPanel';
import BillSummary from '../components/Billing/BillSummary';
import PaymentModeSelector from '../components/Billing/PaymentModeSelector';
import SaleSuccessModal from '../components/Billing/SalesSuccessModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { printBill, downloadBillPDF } from '../utils/billPDF';

const NewBill = () => {
  const { user } = useAuth();
  const scannerInputRef = useRef(null);

  const [billType, setBillType] = useState('CASH');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [showSuccess, setShowSuccess] = useState(null);
  const [customer, setCustomer] = useState({ name: '', phone: '', gstin: '' });

  // Keep hidden input focused so scanner works globally
  useEffect(() => {
    const handleClick = () => {
      if (!showSuccess) {
        scannerInputRef.current?.focus();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showSuccess]);

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

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter') {
      const scannedCode = e.target.value.trim();
      e.target.value = ''; // Clear input
      
      if (!scannedCode) return;

      // Find product by barcode OR hsnCode
      const product = products.find(
        (p) => p.barcode === scannedCode || p.hsnCode === scannedCode
      );

      if (product) {
        addToCart(product);
        toast.success(`${product.name} added!`);
      } else {
        toast.error(`Product not found: ${scannedCode}`);
      }
    }
  };

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
    if (window.confirm('Clear all items from the bill?')) setCart([]);
  };

  const totals = useMemo(() => {
    let subTotal = 0;
    let taxableAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
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
    });

    const grandTotal = taxableAmount + totalCGST + totalSGST + totalIGST;
    const roundedTotal = Math.round(grandTotal);
    const roundOff = roundedTotal - grandTotal;

    return {
      subTotal,
      totalDiscount,
      taxableAmount,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTax: totalCGST + totalSGST + totalIGST,
      grandTotal: roundedTotal,
      roundOff,
    };
  }, [cart]);

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
      toast.error(error.response?.data?.message || 'Failed to generate bill');
    } finally {
      setSaving(false);
    }
  };

  const handleNewBill = () => {
    setCart([]);
    setCustomer({ name: '', phone: '', gstin: '' });
    setShowSuccess(null);
    setPaymentMode('CASH');
  };

  const handlePrint = () => {
    if (!showSuccess) return;
    printBill(showSuccess, user, billType);
  };

  const handleDownload = () => {
    if (!showSuccess) return;
    downloadBillPDF(showSuccess, user, billType);
  };

  if (showSuccess) {
    return (
      <>
        <Header title="Bill Generated" />
        <div className="page-content">
          <div className="page-content-inner">
            <SaleSuccessModal
              sale={showSuccess}
              billType={billType}
              onPrint={handlePrint}
              onDownload={handleDownload}
              onNewBill={handleNewBill}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="New Bill" />
      
      {/* 🔍 HIDDEN BARCODE SCANNER INPUT */}
      <input
        type="text"
        ref={scannerInputRef}
        onKeyDown={handleBarcodeScan}
        style={{ 
          position: 'absolute', 
          opacity: 0, 
          pointerEvents: 'none',
          top: '-100px'
        }}
        autoFocus
      />

      <div className="page-content">
        <div className="page-content-inner">
          <BillTypeSelector value={billType} onChange={setBillType} />

          <div className="pos-layout">
            <div>
              <CustomerForm
                customer={customer}
                onChange={setCustomer}
                billType={billType}
              />
              <ProductPicker
                products={products}
                loading={loading}
                onAdd={addToCart}
              />
            </div>

            <div>
              <CartPanel
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onClear={clearCart}
              />

              {cart.length > 0 && (
                <>
                  <BillSummary totals={totals} billType={billType} />
                  <PaymentModeSelector
                    value={paymentMode}
                    onChange={setPaymentMode}
                  />
                </>
              )}

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
                      <Check size={18} /> Generate Bill
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