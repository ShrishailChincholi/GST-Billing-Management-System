import React from 'react';
import { FileText } from 'lucide-react';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        background: 'var(--color-gray-50)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
          animation: 'pulse 2s infinite',
        }}
      >
        <FileText size={26} />
      </div>
      <div className="spinner"></div>
      <p
        style={{
          fontSize: '14px',
          color: 'var(--color-gray-500)',
          fontWeight: 500,
        }}
      >
        {message}
      </p>
    </div>
  );
};

export default LoadingScreen;