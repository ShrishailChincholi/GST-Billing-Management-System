import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Layout from './components/Layout/Layout';

// Loading Component
import LoadingScreen from './components/Common/LoadingScreen';

// ===== Lazy Loaded Pages =====
// Auth Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// Main Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Invoices = lazy(() => import('./pages/Invoices'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const EditInvoice = lazy(() => import('./pages/EditInvoice'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const Products = lazy(() => import('./pages/Products'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

// Error Pages
const NotFound = lazy(() => import('./pages/NotFound'));



const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading your workspace..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};


const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};


const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
};


function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow:
                '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
            loading: {
              iconTheme: {
                primary: '#2563eb',
                secondary: '#ffffff',
              },
            },
          }}
        />

        {/* Suspense Fallback for Lazy Loaded Routes */}
        <Suspense fallback={<LoadingScreen message="Loading page..." />}>
          <Routes>
            {/* ===== Public Routes (Not Authenticated) ===== */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* ===== Protected Routes (Authenticated) ===== */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* Dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Invoices */}
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/:id" element={<InvoiceDetail />} />
                <Route path="/invoices/:id/edit" element={<EditInvoice />} />
                <Route path="/create-invoice" element={<CreateInvoice />} />

                {/* Clients */}
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetail />} />

                {/* Products */}
                <Route path="/products" element={<Products />} />

                {/* Reports */}
                <Route path="/reports" element={<Reports />} />

                {/* Settings */}
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* ===== Root Redirect ===== */}
            <Route path="/" element={<RootRedirect />} />

            {/* ===== 404 Not Found ===== */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;