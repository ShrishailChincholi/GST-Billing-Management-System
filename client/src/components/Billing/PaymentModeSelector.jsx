import React from 'react';

const PAYMENT_MODES = ['CASH', 'UPI', 'CARD', 'NETBANKING', 'CREDIT'];

const PaymentModeSelector = ({ value, onChange }) => {
  return (
    <div style={{ padding: 'var(--space-4) var(--space-5) 0' }}>
      <p className="customer-panel-title" style={{ marginBottom: 8 }}>
        Payment Mode
      </p>
      <div className="payment-modes">
        {PAYMENT_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`payment-mode${value === mode ? ' active' : ''}`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentModeSelector;