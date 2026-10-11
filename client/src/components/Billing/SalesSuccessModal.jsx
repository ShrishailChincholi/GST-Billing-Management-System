import React from 'react';
import { Check, Printer, Save, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const SaleSuccessModal = ({
  sale,
  billType,
  onPrint,
  onDownload,
  onNewBill,
}) => {
  return (
    <div
      className="modal-backdrop"
      style={{ position: 'static', background: 'transparent' }}
    >
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="sale-success-modal">
          <div className="sale-success-icon">
            <Check size={40} />
          </div>

          <h2>Bill Generated!</h2>
          <p>
            {billType === 'GST' ? 'GST Tax Invoice' : 'Cash Bill'} ·{' '}
            {sale.billNumber}
          </p>

          <div className="sale-success-amount">
            {formatCurrency(sale.grandTotal)}
          </div>

          <div className="sale-success-actions">
            <button onClick={onPrint} className="btn btn-secondary">
              <Printer size={16} /> Print
            </button>
            <button onClick={onDownload} className="btn btn-secondary">
              <Save size={16} /> Download PDF
            </button>
            <button onClick={onNewBill} className="btn btn-primary">
              <Plus size={16} /> New Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleSuccessModal;