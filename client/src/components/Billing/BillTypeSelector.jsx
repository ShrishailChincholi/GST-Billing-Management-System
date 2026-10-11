import React from 'react';
import { Banknote, Receipt } from 'lucide-react';

const BillTypeSelector = ({ value, onChange }) => {
  return (
    <div className="bill-type-selector">
      <button
        type="button"
        onClick={() => onChange('CASH')}
        className={`bill-type-option cash${value === 'CASH' ? ' active' : ''}`}
      >
        <div className="bill-type-option-icon">
          <Banknote size={24} />
        </div>
        <div>
          <p className="bill-type-option-title">Cash Bill</p>
          <p className="bill-type-option-desc">
            Quick sale, no GST breakdown (walk-in customers)
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChange('GST')}
        className={`bill-type-option gst${value === 'GST' ? ' active' : ''}`}
      >
        <div className="bill-type-option-icon">
          <Receipt size={24} />
        </div>
        <div>
          <p className="bill-type-option-title">GST Bill</p>
          <p className="bill-type-option-desc">
            Tax invoice with customer GSTIN & CGST/SGST breakdown
          </p>
        </div>
      </button>
    </div>
  );
};

export default BillTypeSelector;