import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Layout/Header';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  IndianRupee,
  ShoppingCart,
  Package,
  TrendingUp,
  ArrowUpRight,
  Receipt,
  Banknote,
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
import { formatCurrency, formatDate } from '../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    todaySales: 0,
    todayRevenue: 0,
    cashBills: 0,
    gstBills: 0,
    totalTax: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, productsRes] = await Promise.all([
        api.get('/sales/stats'),
        api.get('/products'),
      ]);

      setStats(statsRes.data.data);
      setRecentSales(statsRes.data.data.recentSales || []);
      setProducts(productsRes.data.data || []);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };


  // For a fuller chart, we'd call a dedicated endpoint; here we use what we have
  const revenueChartData = (() => {
    // Group last 7 days
    const days = [];
    const labels = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);

      days.push({
        start: date,
        end: next,
        label: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      });
    }

    // Since we only have 5 recent sales, populate what we can
    const dayBuckets = days.map((d) => ({ ...d, total: 0 }));

    recentSales.forEach((sale) => {
      const saleDate = new Date(sale.billDate);
      const bucket = dayBuckets.find(
        (d) => saleDate >= d.start && saleDate < d.end
      );
      if (bucket) bucket.total += sale.grandTotal;
    });

    dayBuckets.forEach((d) => {
      labels.push(d.label);
      data.push(d.total);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Revenue (₹)',
          data,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#2563eb',
        },
      ],
    };
  })();

  
  const gstChartData = {
    labels: ['Cash Bills', 'GST Bills'],
    datasets: [
      {
        data: [stats.cashBills || 0, stats.gstBills || 0],
        backgroundColor: ['#10b981', '#3b82f6'],
        borderWidth: 0,
      },
    ],
  };

  // ===== Bill Type Breakdown for Donut =====
  const billTypeData = {
    labels: ['Cash', 'GST'],
    datasets: [
      {
        data: [stats.cashBills || 0, stats.gstBills || 0],
        backgroundColor: ['#10b981', '#3b82f6'],
        borderWidth: 0,
      },
    ],
  };

  // ===== Low Stock Products =====
  const lowStockProducts = products.filter((p) => p.stock <= 10).slice(0, 5);

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
          {/* ===== Stats Cards ===== */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">
                <IndianRupee size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Revenue</p>
                <p className="stat-value">
                  {formatCurrency(stats.totalRevenue || 0, false)}
                </p>
                <span className="stat-trend stat-trend-up">
                  <ArrowUpRight size={14} />
                  {stats.todaySales > 0
                    ? `${formatCurrency(stats.todayRevenue || 0, false)} today`
                    : 'No sales today'}
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">
                <ShoppingCart size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Bills</p>
                <p className="stat-value">{stats.totalSales || 0}</p>
                <span className="stat-trend stat-trend-up">
                  <ArrowUpRight size={14} />
                  {stats.todaySales || 0} today
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-purple">
                <Banknote size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Cash Bills</p>
                <p className="stat-value">{stats.cashBills || 0}</p>
                <span className="stat-trend stat-trend-up">
                  <ArrowUpRight size={14} />
                  {stats.totalSales > 0
                    ? `${Math.round((stats.cashBills / stats.totalSales) * 100)}% of sales`
                    : '—'}
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-amber">
                <Receipt size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">GST Bills</p>
                <p className="stat-value">{stats.gstBills || 0}</p>
                <span className="stat-trend stat-trend-up">
                  <ArrowUpRight size={14} />
                  {stats.totalSales > 0
                    ? `${Math.round((stats.gstBills / stats.totalSales) * 100)}% of sales`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* ===== Charts Row ===== */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Revenue — Last 7 Days</h3>
              <div style={{ height: 240 }}>
                <Line
                  data={revenueChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: '#f3f4f6' },
                        ticks: {
                          callback: (v) => `₹${v}`,
                        },
                      },
                      x: { grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>

            <div className="chart-card">
              <h3>Bill Type Breakdown</h3>
              {stats.totalSales === 0 ? (
                <div
                  className="cart-empty"
                  style={{ padding: 40, textAlign: 'center' }}
                >
                  <p style={{ color: 'var(--color-gray-400)' }}>No bills yet</p>
                </div>
              ) : (
                <div className="doughnut-wrapper">
                  <Doughnut
                    data={billTypeData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: { legend: { position: 'bottom' } },
                      cutout: '65%',
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ===== Recent Sales ===== */}
          <div className="recent-invoices-card" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="recent-invoices-header">
              <h3>Recent Sales</h3>
              <Link to="/sales" className="recent-invoices-view-all">
                View All →
              </Link>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bill #</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center"
                        style={{ padding: 40, color: 'var(--color-gray-500)' }}
                      >
                        No sales yet. Create your first bill!
                      </td>
                    </tr>
                  ) : (
                    recentSales.map((sale) => (
                      <tr key={sale._id}>
                        <td className="invoice-number-cell">{sale.billNumber}</td>
                        <td>
                          <span
                            className={`bill-type-badge ${sale.billType?.toLowerCase()}`}
                          >
                            {sale.billType}
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
                        <td>{formatDate(sale.billDate)}</td>
                        <td className="table-amount">
                          {formatCurrency(sale.grandTotal, false)}
                        </td>
                        <td>
                          <span className="badge badge-paid">
                            {sale.paymentMode || 'CASH'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== Low Stock Alert ===== */}
          {lowStockProducts.length > 0 && (
            <div className="recent-invoices-card">
              <div className="recent-invoices-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Package size={18} /> Low Stock Products
                </h3>
                <Link to="/products" className="recent-invoices-view-all">
                  Manage →
                </Link>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>HSN</th>
                      <th>Stock</th>
                      <th>Unit</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                          }}
                        >
                          {p.hsnCode}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color:
                                p.stock <= 5
                                  ? 'var(--color-danger)'
                                  : 'var(--color-warning)',
                            }}
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td>{p.unit}</td>
                        <td>{formatCurrency(p.rate, false)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;