import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Search,
  Receipt,
  Banknote,
  Eye,
  Printer,
  FileText,
  IndianRupee,
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

  useEffect(() => {
    let result = sales;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          (s.customerName || s.clientDetails?.name || '').toLowerCase().includes(q)
      );
    }
    if (typeFilter) {
      result = result.filter((s) => (s.billType || 'GST') === typeFilter);
    }
    setFiltered(result);
  }, [search, typeFilter, sales]);

  const fetchSales = async () => {
    try {
      const { data } = await api.get('/invoices');
      setSales(data.data);
      setFiltered(data.data);
    } catch (error) {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((s, i) => s + i.grandTotal, 0),
    cashBills: sales.filter((s) => (s.billType || 'GST') === 'CASH').length,
    gstBills: sales.filter((s) => (s.billType || 'GST') === 'GST').length,
  };

  const getCustomerName = (sale) =>
    sale.customerName || sale.clientDetails?.name || 'Walk-in Customer';

  return (
    <>
      <Header title="Sales History" />
      <div className="page-content">
        <div className="page-content-inner">
          {/* Stats */}
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
                <p className="stat-value">{formatCurrency(stats.totalRevenue, false)}</p>
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

          {/* Table */}
          <div className="table-container">
            <div className="table-toolbar">
              <div className="table-toolbar-filters">
                <div className="table-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search by bill number or customer..."
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
                      const type = sale.billType || 'GST';
                      return (
                        <tr key={sale._id}>
                          <td className="invoice-number-cell">{sale.invoiceNumber}</td>
                          <td>
                            <span className={`bill-type-badge ${type.toLowerCase()}`}>
                              {type === 'GST' ? <FileText size={10} /> : <Banknote size={10} />}
                              {type}
                            </span>
                          </td>
                          <td>
                            <div className="invoice-client-cell">
                              <span className="invoice-client-name">
                                {getCustomerName(sale)}
                              </span>
                              {sale.customerPhone && (
                                <span className="invoice-client-gstin">
                                  {sale.customerPhone}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{formatDate(sale.invoiceDate)}</td>
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
                                onClick={() =>
                                  downloadBillPDF(sale, user, type)
                                }
                                className="table-action-btn primary"
                                title="Download PDF"
                              >
                                <FileText size={16} />
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