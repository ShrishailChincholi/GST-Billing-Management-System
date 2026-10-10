import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { downloadInvoicePDF } from '../utils/invoicePDF';
import { useAuth } from '../context/AuthContext';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data } = await api.get(`/invoices/${id}`);
      setInvoice(data.data);
    } catch (error) {
      toast.error('Invoice not found');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Invoice" />
        <div className="page-content">
          <div className="spinner" style={{ margin: '40px auto' }}></div>
        </div>
      </>
    );
  }

  if (!invoice) return null;

  return (
    <>
      <Header title={`Invoice ${invoice.invoiceNumber}`} />
      <div className="page-content">
        <div className="page-content-inner">
          <div className="invoice-detail-header">
            <div className="invoice-detail-title">
              <button
                onClick={() => navigate('/invoices')}
                className="btn btn-ghost btn-sm"
                style={{ alignSelf: 'flex-start', marginBottom: 8 }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <span className="invoice-detail-number">{invoice.invoiceNumber}</span>
              <span className="invoice-detail-client">
                {invoice.clientDetails?.name}
              </span>
            </div>
            <div className="invoice-detail-actions">
              <button
                onClick={() => downloadInvoicePDF(invoice, user)}
                className="btn btn-primary"
              >
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>

          <div className="card">
            <div className="summary-row">
              <span className="summary-row-label">Invoice Date</span>
              <span className="summary-row-value">{formatDate(invoice.invoiceDate)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row-label">Due Date</span>
              <span className="summary-row-value">{formatDate(invoice.dueDate)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row-label">Status</span>
              <span className="summary-row-value">{invoice.status}</span>
            </div>
            <div className="summary-row total">
              <span className="summary-row-label">Grand Total</span>
              <span className="summary-row-value">
                {formatCurrency(invoice.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceDetail;