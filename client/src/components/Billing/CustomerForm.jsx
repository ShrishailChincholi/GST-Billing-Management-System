import React from 'react';

const CustomerForm = ({ customer, onChange, billType }) => {
  const isGST = billType === 'GST';

  return (
    <div className="customer-panel">
      <p className="customer-panel-title">
        {isGST ? 'Customer Details (Required)' : 'Customer Details (Optional)'}
      </p>

      <div className="invoice-form-row two-col">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">
            Customer Name {isGST && <span style={{ color: 'var(--color-danger)' }}>*</span>}
          </label>
          <input
            type="text"
            value={customer.name}
            onChange={(e) => onChange({ ...customer, name: e.target.value })}
            className="input-field"
            placeholder={isGST ? 'ABC Traders' : 'Walk-in Customer'}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">Phone</label>
          <input
            type="tel"
            value={customer.phone}
            onChange={(e) => onChange({ ...customer, phone: e.target.value })}
            className="input-field"
            placeholder="9876543210"
            maxLength={10}
          />
        </div>
      </div>

      {isGST && (
        <div
          className="form-group"
          style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}
        >
          <label className="label">Customer GSTIN</label>
          <input
            type="text"
            value={customer.gstin}
            onChange={(e) =>
              onChange({ ...customer, gstin: e.target.value.toUpperCase() })
            }
            className="input-field"
            placeholder="29AABCT1332L1Z8"
            maxLength={15}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      )}
    </div>
  );
};

export default CustomerForm;