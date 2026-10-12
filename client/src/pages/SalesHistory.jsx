import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Search,
  Receipt,
  Banknote,
  Printer,
  FileText,
  IndianRupee,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { printBill, downloadBillPDF } from '../utils/billPDF';
import { useAuth } from '../context/AuthContext';

const SalesHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  // ===== Filter =====
  useEffect(() => {
    let result = sales;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          (s.billNumber || '').toLowerCase().includes(q) ||
          (s.customerName || '').toLowerCase().includes(q) ||
          (s.customerPhone || '').includes(q)
      );
    }
    if (typeFilter) {
      result = result.filter((s) => s.billType === typeFilter);
    }
    setFiltered(result);
  }, [search, typeFilter, sales]);

  // ===== Fetch =====
  const fetchSales = async () => {
    try {
      const { data } = await api.get('/sales');   // ✅ FIXED: /sales not /invoices
      setSales(data.data || []);
      setFiltered(data.data || []);
    } catch (error) {
      toast.error('Failed to load sales');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ===== Delete =====
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill? Stock will be restored.')) return;
    try {
      await api.delete(`/sales/${id}`);
      toast.success('Bill deleted');
      fetchSales();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  // ===== Stats =====
  const stats = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((s, i) => s + (i.grandTotal || 0), 0),
    cashBills: sales.filter((s) => s.billType === 'CASH').length,
    gstBills: sales.filter((s) => s.billType === 'GST').length,
  };

  return (
    <>
      <Header title="Sales History" />
      <div className="page-content">
        <div className="page-content-inner">
          {/* ===== Stats ===== */}
          <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">
                <Receipt size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Sales</p>
                <p className="stat-value">{stats.totalSales}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">
                <IndianRupee size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Revenue</p>
                <p className="stat-value">
                  {formatCurrency(stats.totalRevenue, false)}
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-amber">
                <Banknote size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Cash Bills</p>
                <p className="stat-value">{stats.cashBills}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-purple">
                <FileText size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">GST Bills</p>
                <p className="stat-value">{stats.gstBills}</p>
              </div>
            </div>
          </div>

          {/* ===== Table ===== */}
          <div className="table-container">
            <div className="table-toolbar">
              <div className="table-toolbar-filters">
                <div className="table-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search by bill #, customer, phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="invoice-list-filter-select"
                >
                  <option value="">All Types</option>
                  <option value="CASH">Cash Bills</option>
                  <option value="GST">GST Bills</option>
                </select>
              </div>
              <button
                onClick={() => navigate('/new-bill')}
                className="btn btn-primary"
              >
                <Receipt size={18} /> New Bill
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <Receipt size={64} className="empty-state-icon" />
                <h3>No sales yet</h3>
                <p>Start billing to see your sales history here.</p>
                <button
                  onClick={() => navigate('/new-bill')}
                  className="btn btn-primary"
                >
                  <Receipt size={18} /> Create First Bill
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Bill #</th>
                      <th>Type</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((sale) => {
                      const type = sale.billType || 'CASH';
                      return (
                        <tr key={sale._id}>
                          {/* ✅ billNumber instead of invoiceNumber */}
                          <td className="invoice-number-cell">
                            {sale.billNumber || '—'}
                          </td>
                          <td>
                            <span
                              className={`bill-type-badge ${type.toLowerCase()}`}
                            >
                              {type === 'GST' ? (
                                <FileText size={10} />
                              ) : (
                                <Banknote size={10} />
                              )}
                              {type}
                            </span>
                          </td>
                          <td>
                            <div className="invoice-client-cell">
                              <span className="invoice-client-name">
                                {sale.customerName || 'Walk-in Customer'}
                              </span>
                              {sale.customerPhone && (
                                <span className="invoice-client-gstin">
                                  {sale.customerPhone}
                                </span>
                              )}
                            </div>
                          </td>
                          {/* ✅ billDate instead of invoiceDate */}
                          <td>{formatDate(sale.billDate)}</td>
                          <td>{sale.items?.length || 0}</td>
                          <td className="table-amount">
                            {formatCurrency(sale.grandTotal, false)}
                          </td>
                          <td>
                            <span className="badge badge-paid">
                              {sale.paymentMode || 'CASH'}
                            </span>
                          </td>
                          <td>
                            <div
                              className="table-actions"
                              style={{ justifyContent: 'flex-end' }}
                            >
                              <button
                                onClick={() => printBill(sale, user, type)}
                                className="table-action-btn"
                                title="Print"
                              >
                                <Printer size={16} />
                              </button>
                              <button
                                onClick={() => downloadBillPDF(sale, user, type)}
                                className="table-action-btn primary"
                                title="Download PDF"
                              >
                                <FileText size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(sale._id)}
                                className="table-action-btn danger"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SalesHistory;