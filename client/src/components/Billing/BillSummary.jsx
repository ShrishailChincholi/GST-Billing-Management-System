import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const BillSummary = ({ totals, billType, showRoundOff = true }) => {
  const isGST = billType === 'GST';

  return (
    <div className="bill-summary">
      <div className="bill-summary-row">
        <span className="bill-summary-row-label">Sub Total</span>
        <span className="bill-summary-row-value">
          {formatCurrency(totals.subTotal)}
        </span>
      </div>

      {totals.totalDiscount > 0 && (
        <div className="bill-summary-row">
          <span className="bill-summary-row-label">Discount</span>
          <span className="bill-summary-row-value" style={{ color: 'var(--color-danger)' }}>
            − {formatCurrency(totals.totalDiscount)}
          </span>
        </div>
      )}

      {isGST && (
        <>
          <div className="bill-summary-row">
            <span className="bill-summary-row-label">Taxable Amount</span>
            <span className="bill-summary-row-value">
              {formatCurrency(totals.taxableAmount)}
            </span>
          </div>
          {totals.totalCGST > 0 && (
            <div className="bill-summary-row">
              <span className="bill-summary-row-label">CGST</span>
              <span className="bill-summary-row-value">
                {formatCurrency(totals.totalCGST)}
              </span>
            </div>
          )}
          {totals.totalSGST > 0 && (
            <div className="bill-summary-row">
              <span className="bill-summary-row-label">SGST</span>
              <span className="bill-summary-row-value">
                {formatCurrency(totals.totalSGST)}
              </span>
            </div>
          )}
          {totals.totalIGST > 0 && (
            <div className="bill-summary-row">
              <span className="bill-summary-row-label">IGST</span>
              <span className="bill-summary-row-value">
                {formatCurrency(totals.totalIGST)}
              </span>
            </div>
          )}
        </>
      )}

      {showRoundOff && totals.roundOff !== 0 && (
        <div className="bill-summary-row">
          <span className="bill-summary-row-label">Round Off</span>
          <span className="bill-summary-row-value">
            {totals.roundOff > 0 ? '+' : ''}
            {totals.roundOff.toFixed(2)}
          </span>
        </div>
      )}

      <div className="bill-summary-row total">
        <span className="bill-summary-row-label">Grand Total</span>
        <span className="bill-summary-row-value">
          {formatCurrency(totals.grandTotal)}
        </span>
      </div>
    </div>
  );
};

export default BillSummary;