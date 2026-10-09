import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--color-gray-50)',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: 480,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            margin: '0 auto 24px',
            background: 'var(--color-primary-50)',
            borderRadius: 'var(--radius-2xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary-600)',
          }}
        >
          <AlertCircle size={48} />
        </div>

        <h1
          style={{
            fontSize: '72px',
            fontWeight: 800,
            color: 'var(--color-primary-600)',
            margin: 0,
            lineHeight: 1,
            letterSpacing: '-0.04em',
          }}
        >
          404
        </h1>

        <h2
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-gray-900)',
            margin: '12px 0 8px',
          }}
        >
          Page Not Found
        </h2>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-gray-500)',
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to your dashboard.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link to="/dashboard" className="btn btn-primary">
            <Home size={18} />
            Back to Dashboard
          </Link>
          <Link to="/invoices" className="btn btn-secondary">
            <Search size={18} />
            View Invoices
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
