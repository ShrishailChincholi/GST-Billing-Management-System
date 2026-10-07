import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Layout/Header';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  FileText,
  Download,
} from 'lucide-react';
import { generateInvoicePDF } from '../utils/invoicePDF';
import { useAuth } from '../context/AuthContext';

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    let result = invoices;
    if (search) {
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          inv.clientDetails?.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter) {
      result = result.filter((inv) => inv.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, invoices]);

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/invoices');
      setInvoices(data.data);
      setFiltered(data.data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const handleDownloadPDF = (invoice) => {
    const doc = generateInvoicePDF(invoice, user);
    doc.save(`${invoice.invoiceNumber}.pdf`);
    toast.success('PDF downloaded');
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status) => {
    const map = {
      DRAFT: 'badge-draft',
      ISSUED: 'badge-issued',
      PAID: 'badge-paid',
      OVERDUE: 'badge-overdue',
      CANCELLED: 'badge-cancelled',
      PARTIALLY_PAID: 'badge-partially-paid',
    };
    return `badge ${map[status] || 'badge-draft'}`;
  };

  return (
    <>
      <Header title="Invoices" />
      <div className="page-content">
        <div className="page-content-inner">
          <div className="table-container">
            {/* Toolbar */}
            <div className="table-toolbar">
              <div className="table-toolbar-filters">
                <div className="table-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field"
                  style={{ width: 160, padding: '8px 32px 8px 12px', fontSize: 14 }}
                >
                  <option value="">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ISSUED">Issued</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <Link to="/create-invoice" className="btn btn-primary">
                <Plus size={18} /> New Invoice
              </Link>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <FileText size={64} className="empty-state-icon" />
                <h3>No invoices found</h3>
                <p>Create your first GST invoice to get started.</p>
                <Link to="/create-invoice" className="btn btn-primary">
                  <Plus size={18} /> Create Invoice
                </Link>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Client</th>
                      <th>Date</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((invoice) => (
                      <tr key={invoice._id}>
                        <td className="table-primary">{invoice.invoiceNumber}</td>
                        <td>{invoice.clientDetails?.name}</td>
                        <td>
                          {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                        </td>
                        <td>
                          {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="table-amount">
                          {formatCurrency(invoice.grandTotal)}
                        </td>
                        <td>
                          <span className={getStatusBadge(invoice.status)}>
                            {invoice.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="table-action-btn primary"
                              title="Download PDF"
                              onClick={() => handleDownloadPDF(invoice)}
                            >
                              <Download size={16} />
                            </button>
                            <Link
                              to={`/invoices/${invoice._id}`}
                              className="table-action-btn"
                              title="View"
                            >
                              <Eye size={16} />
                            </Link>
                            {invoice.status === 'DRAFT' && (
                              <button
                                className="table-action-btn danger"
                                title="Delete"
                                onClick={() => handleDelete(invoice._id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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

export default Invoices;