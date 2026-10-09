import React, { useState, useEffect } from 'react';
import Header from '../components/Layout/Header';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Receipt,
  Users,
  IndianRupee,
} from 'lucide-react';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const TABS = [
  { id: 'gstr1', label: 'GSTR-1', icon: FileText },
  { id: 'gstr3b', label: 'GSTR-3B', icon: Receipt },
  { id: 'sales', label: 'Sales Summary', icon: TrendingUp },
  { id: 'tax', label: 'Tax Liability', icon: IndianRupee },
  { id: 'clients', label: 'Client-wise', icon: Users },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('gstr1');
  const [period, setPeriod] = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [activeTab, period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (period === 'custom' && customFrom && customTo) {
        params.from = customFrom;
        params.to = customTo;
      }

      let endpoint = '';
      switch (activeTab) {
        case 'gstr1':
          endpoint = '/reports/gstr1';
          break;
        case 'gstr3b':
          endpoint = '/reports/gstr3b';
          break;
        case 'sales':
          endpoint = '/reports/sales-summary';
          break;
        case 'tax':
          endpoint = '/reports/tax-liability';
          break;
        case 'clients':
          endpoint = '/reports/client-wise';
          break;
        default:
          endpoint = '/reports/gstr1';
      }

      const res = await api.get(endpoint, { params });
      setData(res.data.data || res.data);
    } catch (error) {
      toast.error('Failed to load report');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustom = () => {
    if (!customFrom || !customTo) {
      toast.error('Please select both start and end dates');
      return;
    }
    fetchReport();
  };

  const handleExportCSV = () => {
    if (!data) return;

    let rows = [];
    let filename = '';

    if (activeTab === 'gstr1') {
      filename = 'GSTR1_Report.csv';
      rows.push(['Invoice #', 'Client', 'GSTIN', 'Date', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total']);
      (data.b2b || []).forEach((r) => {
        rows.push([
          r.invoiceNumber,
          r.receiverName,
          r.gstin,
          new Date(r.invoiceDate).toLocaleDateString('en-IN'),
          r.taxableValue,
          (r.taxableValue * r.rate) / 200,
          (r.taxableValue * r.rate) / 200,
          r.igst || 0,
          r.invoiceValue,
        ]);
      });
    } else if (activeTab === 'clients') {
      filename = 'Client_Wise_Sales.csv';
      rows.push(['Client', 'GSTIN', 'Type', 'Invoices', 'Taxable', 'Total', 'Paid', 'Pending']);
      (data || []).forEach((r) => {
        rows.push([
          r.clientName,
          r.gstin,
          r.clientType,
          r.totalInvoices,
          r.totalTaxableValue,
          r.totalAmount,
          r.totalPaid,
          r.totalPending,
        ]);
      });
    } else {
      toast.error('CSV export not available for this report yet');
      return;
    }

    const csv = rows.map((r) => r.map((v) => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount || 0);

  return (
    <>
      <Header title="GST Reports" />

      <div className="page-content">
        <div className="page-content-inner">
          {/* Report Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 'var(--space-6)',
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    border: '1px solid',
                    borderColor: isActive ? 'var(--color-primary-600)' : 'var(--color-gray-200)',
                    background: isActive ? 'var(--color-primary-600)' : 'var(--color-white)',
                    color: isActive ? 'var(--color-white)' : 'var(--color-gray-700)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Period Filter */}
          <div
            className="card"
            style={{ marginBottom: 'var(--space-6)' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--color-gray-700)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                }}
              >
                <Calendar size={16} />
                Period:
              </div>

              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="invoice-list-filter-select"
                style={{ minWidth: 160 }}
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>

              {period === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="input-field"
                    style={{ width: 'auto' }}
                  />
                  <span style={{ color: 'var(--color-gray-500)' }}>to</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="input-field"
                    style={{ width: 'auto' }}
                  />
                  <button
                    onClick={handleApplyCustom}
                    className="btn btn-primary btn-sm"
                  >
                    Apply
                  </button>
                </>
              )}

              <div style={{ marginLeft: 'auto' }}>
                <button
                  onClick={handleExportCSV}
                  className="btn btn-secondary btn-sm"
                  disabled={!data || loading}
                >
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Report Content */}
          {loading ? (
            <div
              className="card"
              style={{ padding: 60, textAlign: 'center' }}
            >
              <div className="spinner" style={{ margin: '0 auto' }}></div>
              <p
                style={{
                  marginTop: 16,
                  color: 'var(--color-gray-500)',
                  fontSize: 14,
                }}
              >
                Generating report...
              </p>
            </div>
          ) : !data ? (
            <div className="card">
              <div className="empty-state">
                <BarChart3 size={64} className="empty-state-icon" />
                <h3>No data available</h3>
                <p>Create some invoices to see reports here.</p>
              </div>
            </div>
          ) : (
            <>
              {/* ============ GSTR-1 ============ */}
              {activeTab === 'gstr1' && data.totals && (
                <>
                  <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
                    <StatCard
                      label="Total Invoices"
                      value={data.totals.totalInvoices}
                      color="blue"
                    />
                    <StatCard
                      label="Taxable Value"
                      value={formatCurrency(data.totals.totalTaxableValue)}
                      color="purple"
                    />
                    <StatCard
                      label="Total Tax"
                      value={formatCurrency(
                        data.totals.totalCGST +
                          data.totals.totalSGST +
                          data.totals.totalIGST
                      )}
                      color="amber"
                    />
                    <StatCard
                      label="Invoice Value"
                      value={formatCurrency(data.totals.totalInvoiceValue)}
                      color="green"
                    />
                  </div>

                  {/* B2B Table */}
                  <div className="table-container" style={{ marginBottom: 'var(--space-6)' }}>
                    <div
                      style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid var(--color-gray-100)',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        B2B Invoices ({data.b2b?.length || 0})
                      </h3>
                    </div>
                    {data.b2b?.length > 0 ? (
                      <div className="table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>GSTIN</th>
                              <th>Receiver</th>
                              <th>Invoice #</th>
                              <th>Date</th>
                              <th>Taxable</th>
                              <th>Rate</th>
                              <th>Invoice Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.b2b.map((row, i) => (
                              <tr key={i}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                                  {row.gstin}
                                </td>
                                <td>{row.receiverName}</td>
                                <td className="table-primary">{row.invoiceNumber}</td>
                                <td style={{ fontSize: 12 }}>
                                  {new Date(row.invoiceDate).toLocaleDateString('en-IN')}
                                </td>
                                <td className="table-amount">
                                  {formatCurrency(row.taxableValue)}
                                </td>
                                <td>
                                  <span className="badge badge-issued">
                                    {row.rate}%
                                  </span>
                                </td>
                                <td className="table-amount">
                                  {formatCurrency(row.invoiceValue)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: 24, color: 'var(--color-gray-500)', fontSize: 13 }}>
                        No B2B invoices in this period.
                      </div>
                    )}
                  </div>

                  {/* HSN Summary */}
                  <div className="table-container">
                    <div
                      style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid var(--color-gray-100)',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        HSN Summary ({data.hsnSummary?.length || 0})
                      </h3>
                    </div>
                    {data.hsnSummary?.length > 0 ? (
                      <div className="table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>HSN</th>
                              <th>Description</th>
                              <th>UQC</th>
                              <th>Qty</th>
                              <th>Taxable</th>
                              <th>CGST</th>
                              <th>SGST</th>
                              <th>IGST</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.hsnSummary.map((row, i) => (
                              <tr key={i}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                                  {row.hsnCode}
                                </td>
                                <td>{row.description}</td>
                                <td>{row.uqc}</td>
                                <td>{row.quantity}</td>
                                <td className="table-amount">
                                  {formatCurrency(row.taxableValue)}
                                </td>
                                <td>{formatCurrency(row.cgst)}</td>
                                <td>{formatCurrency(row.sgst)}</td>
                                <td>{formatCurrency(row.igst)}</td>
                                <td className="table-amount">
                                  {formatCurrency(row.totalValue)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: 24, color: 'var(--color-gray-500)', fontSize: 13 }}>
                        No HSN data available.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ============ GSTR-3B ============ */}
              {activeTab === 'gstr3b' && data.section31 && (
                <>
                  <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
                    <StatCard
                      label="Taxable Value"
                      value={formatCurrency(data.section31.outwardTaxableSupplies.taxableValue)}
                      color="blue"
                    />
                    <StatCard
                      label="CGST Payable"
                      value={formatCurrency(data.netTaxPayable.cgst)}
                      color="purple"
                    />
                    <StatCard
                      label="SGST Payable"
                      value={formatCurrency(data.netTaxPayable.sgst)}
                      color="amber"
                    />
                    <StatCard
                      label="IGST Payable"
                      value={formatCurrency(data.netTaxPayable.igst)}
                      color="green"
                    />
                  </div>

                  <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <h3
                      style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: 600,
                        marginBottom: 16,
                      }}
                    >
                      3.1 Outward Supplies
                    </h3>
                    <div className="summary-row">
                      <span className="summary-row-label">Taxable Value</span>
                      <span className="summary-row-value">
                        {formatCurrency(data.section31.outwardTaxableSupplies.taxableValue)}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-row-label">IGST</span>
                      <span className="summary-row-value">
                        {formatCurrency(data.section31.outwardTaxableSupplies.igst)}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-row-label">CGST</span>
                      <span className="summary-row-value">
                        {formatCurrency(data.section31.outwardTaxableSupplies.cgst)}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-row-label">SGST</span>
                      <span className="summary-row-value">
                        {formatCurrency(data.section31.outwardTaxableSupplies.sgst)}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-row-label">Cess</span>
                      <span className="summary-row-value">
                        {formatCurrency(data.section31.outwardTaxableSupplies.cess)}
                      </span>
                    </div>
                  </div>

                  <div className="card">
                    <h3
                      style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: 600,
                        marginBottom: 16,
                      }}
                    >
                      Breakdown
                    </h3>
                    <div className="summary-row">
                      <span className="summary-row-label">Inter-State Invoices</span>
                      <span className="summary-row-value">
                        {data.breakdown.interState.count}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-row-label">Inter-State IGST</span>
                      <span className="summary-row-value">
                        {formatCurrency(data.breakdown.interState.igst)}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-row-label">Intra-State Invoices</span>
                      <span className="summary-row-value">
                        {data.breakdown.intraState.count}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-row-label">Intra-State CGST + SGST</span>
                      <span className="summary-row-value">
                        {formatCurrency(
                          data.breakdown.intraState.cgst + data.breakdown.intraState.sgst
                        )}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* ============ Sales Summary ============ */}
              {activeTab === 'sales' && data.summary && (
                <>
                  <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
                    <StatCard
                      label="Total Invoices"
                      value={data.summary.totalInvoices}
                      color="blue"
                    />
                    <StatCard
                      label="Total Revenue"
                      value={formatCurrency(data.summary.totalRevenue)}
                      color="green"
                    />
                    <StatCard
                      label="Total Paid"
                      value={formatCurrency(data.summary.totalPaid)}
                      color="purple"
                    />
                    <StatCard
                      label="Total Pending"
                      value={formatCurrency(data.summary.totalPending)}
                      color="amber"
                    />
                  </div>

                  <div className="table-container" style={{ marginBottom: 'var(--space-6)' }}>
                    <div
                      style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid var(--color-gray-100)',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        Top Clients
                      </h3>
                    </div>
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Client</th>
                            <th>GSTIN</th>
                            <th>Invoices</th>
                            <th>Total Sales</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.topClients || []).map((c, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 500 }}>{c.name}</td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                                {c.gstin || '—'}
                              </td>
                              <td>{c.count}</td>
                              <td className="table-amount">
                                {formatCurrency(c.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ============ Tax Liability ============ */}
              {activeTab === 'tax' && data.totals && (
                <>
                  <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
                    <StatCard
                      label="Taxable Value"
                      value={formatCurrency(data.totals.taxableValue)}
                      color="blue"
                    />
                    <StatCard
                      label="CGST"
                      value={formatCurrency(data.totals.cgst)}
                      color="purple"
                    />
                    <StatCard
                      label="SGST"
                      value={formatCurrency(data.totals.sgst)}
                      color="amber"
                    />
                    <StatCard
                      label="Total Tax"
                      value={formatCurrency(data.totals.totalTax)}
                      color="green"
                    />
                  </div>

                  <div className="table-container">
                    <div
                      style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid var(--color-gray-100)',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        Rate-wise Breakdown
                      </h3>
                    </div>
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>GST Rate</th>
                            <th>Taxable Value</th>
                            <th>CGST</th>
                            <th>SGST</th>
                            <th>IGST</th>
                            <th>Total Tax</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.rateWise || []).map((r, i) => (
                            <tr key={i}>
                              <td>
                                <span className="badge badge-issued">{r.rate}%</span>
                              </td>
                              <td className="table-amount">
                                {formatCurrency(r.taxableValue)}
                              </td>
                              <td>{formatCurrency(r.cgst)}</td>
                              <td>{formatCurrency(r.sgst)}</td>
                              <td>{formatCurrency(r.igst)}</td>
                              <td className="table-amount">
                                {formatCurrency(r.cgst + r.sgst + r.igst + r.cess)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ============ Client-wise ============ */}
              {activeTab === 'clients' && Array.isArray(data) && (
                <div className="table-container">
                  <div
                    style={{
                      padding: '16px 24px',
                      borderBottom: '1px solid var(--color-gray-100)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      Client-wise Sales ({data.length})
                    </h3>
                  </div>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>GSTIN</th>
                          <th>Type</th>
                          <th>Invoices</th>
                          <th>Taxable</th>
                          <th>Total Sales</th>
                          <th>Paid</th>
                          <th>Pending</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((c, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{c.clientName}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                              {c.gstin || '—'}
                            </td>
                            <td>
                              <span className="badge badge-issued">{c.clientType}</span>
                            </td>
                            <td>{c.totalInvoices}</td>
                            <td>{formatCurrency(c.totalTaxableValue)}</td>
                            <td className="table-amount">
                              {formatCurrency(c.totalAmount)}
                            </td>
                            <td style={{ color: 'var(--color-success)' }}>
                              {formatCurrency(c.totalPaid)}
                            </td>
                            <td style={{ color: 'var(--color-warning)' }}>
                              {formatCurrency(c.totalPending)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

// Inline StatCard component
const StatCard = ({ label, value, color = 'blue' }) => {
  const colors = {
    blue: { bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' },
    green: { bg: 'var(--color-success-light)', color: 'var(--color-success-dark)' },
    amber: { bg: 'var(--color-warning-light)', color: 'var(--color-warning-dark)' },
    purple: { bg: 'var(--color-purple-light)', color: 'var(--color-purple)' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="stat-card">
      <div
        className="stat-icon"
        style={{ background: c.bg, color: c.color }}
      >
        <BarChart3 size={24} />
      </div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
};

export default Reports;