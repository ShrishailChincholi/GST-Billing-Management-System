import React from 'react';
import Header from '../components/Layout/Header';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();

  return (
    <>
      <Header title="Settings" />
      <div className="page-content">
        <div className="page-content-inner">
          <div className="card" style={{ maxWidth: 640 }}>
            <h3 style={{ marginBottom: 16 }}>Business Profile</h3>
            <div className="summary-row">
              <span className="summary-row-label">Business Name</span>
              <span className="summary-row-value">{user?.businessName || '—'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row-label">GSTIN</span>
              <span className="summary-row-value" style={{ fontFamily: 'var(--font-mono)' }}>
                {user?.gstin || '—'}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-row-label">Owner Name</span>
              <span className="summary-row-value">{user?.name || '—'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row-label">Email</span>
              <span className="summary-row-value">{user?.email || '—'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-row-label">Role</span>
              <span className="summary-row-value">{user?.role || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;