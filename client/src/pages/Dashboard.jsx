import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Layout/Header';
import api from '../services/api';
import {
  IndianRupee,
  FileText,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalClients: 0,
    pendingAmount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [invoicesRes, clientsRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/clients'),
      ]);

      const invoices = invoicesRes.data.data;
      const clients = clientsRes.data.data;

      const totalRevenue = invoices
        .filter((inv) => inv.status === 'PAID')
        .reduce((sum, inv) => sum + inv.grandTotal, 0);

      const pendingAmount = invoices
        .filter((inv) => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status))
        .reduce((sum, inv) => sum + inv.balanceDue, 0);

      setStats({
        totalRevenue,
        totalInvoices: invoices.length,
        totalClients: clients.length,
        pendingAmount,
      });

      setRecentInvoices(invoices.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: [45000, 52000, 48000, 61000, 55000, 67000],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const gstChartData = {
    labels: ['CGST', 'SGST', 'IGST'],
    datasets: [
      {
        data: [35, 35, 30],
        backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'],
        borderWidth: 0,
      },
    ],
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  if (loading) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="page-content">
          <div className="spinner-overlay">
            <div className="spinner"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Dashboard" />
      <div className="page-content">
        <div className="page-content-inner">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">
                <IndianRupee size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Revenue</p>
                <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
                <span className="stat-trend stat-trend-up">
                  <ArrowUpRight size={14} /> 12.5% from last month
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">
                <FileText size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Invoices</p>
                <p className="stat-value">{stats.totalInvoices}</p>
                <span className="stat-trend stat-trend-up">
                  <ArrowUpRight size={14} /> 8 new this month
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-purple">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Clients</p>
                <p className="stat-value">{stats.totalClients}</p>
                <span className="stat-trend stat-trend-up">
                  <ArrowUpRight size={14} /> 3 new this month
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-amber">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Pending Amount</p>
                <p className="stat-value">{formatCurrency(stats.pendingAmount)}</p>
                <span className="stat-trend stat-trend-down">
                  <ArrowDownRight size={14} /> 5 invoices pending
                </span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Revenue Trend</h3>
              <Line
                data={revenueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                    x: { grid: { display: false } },
                  },
                }}
                height={250}
              />
            </div>

            <div className="chart-card">
              <h3>GST Breakdown</h3>
              <div className="doughnut-wrapper">
                <Doughnut
                  data={gstChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { position: 'bottom' } },
                    cutout: '65%',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="recent-invoices-card">
            <div className="recent-invoices-header">
              <h3>Recent Invoices</h3>
              <a href="/invoices" className="recent-invoices-view-all">
                View All →
              </a>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-gray-500">
                        No invoices yet. Create your first invoice!
                      </td>
                    </tr>
                  ) : (
                    recentInvoices.map((invoice) => (
                      <tr key={invoice._id}>
                        <td className="table-primary">{invoice.invoiceNumber}</td>
                        <td>{invoice.clientDetails?.name}</td>
                        <td>
                          {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="table-amount">
                          {formatCurrency(invoice.grandTotal)}
                        </td>
                        <td>
                          <span className={getStatusBadge(invoice.status)}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;