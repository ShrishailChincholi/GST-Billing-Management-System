/**
 * GST Calculator - Core logic for Indian GST calculation
 * Handles CGST/SGST (intra-state) and IGST (inter-state) automatically
 */

const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28];

/**
 * Determine if transaction is inter-state based on state codes
 */
const isInterState = (supplierStateCode, recipientStateCode) => {
  return supplierStateCode !== recipientStateCode;
};

/**
 * Calculate GST for a single line item
 */
const calculateLineItemGST = (item, supplierStateCode, recipientStateCode) => {
  const taxableAmount = item.quantity * item.rate - (item.discount || 0);
  const gstRate = item.gstRate;
  const cessRate = item.cessRate || 0;

  const totalGST = (taxableAmount * gstRate) / 100;
  const totalCess = (taxableAmount * cessRate) / 100;

  const interState = isInterState(supplierStateCode, recipientStateCode);

  let cgstRate = 0,
    sgstRate = 0,
    igstRate = 0;
  let cgstAmount = 0,
    sgstAmount = 0,
    igstAmount = 0;

  if (interState) {
    igstRate = gstRate;
    igstAmount = totalGST;
  } else {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = totalGST / 2;
    sgstAmount = totalGST / 2;
  }

  return {
    ...item,
    taxableAmount: parseFloat(taxableAmount.toFixed(2)),
    gstRate,
    cgstRate,
    sgstRate,
    igstRate,
    cessRate,
    cgstAmount: parseFloat(cgstAmount.toFixed(2)),
    sgstAmount: parseFloat(sgstAmount.toFixed(2)),
    igstAmount: parseFloat(igstAmount.toFixed(2)),
    cessAmount: parseFloat(totalCess.toFixed(2)),
    totalAmount: parseFloat((taxableAmount + totalGST + totalCess).toFixed(2)),
  };
};

/**
 * Calculate full invoice totals
 */
const calculateInvoiceTotals = (items, supplierStateCode, recipientStateCode) => {
  const processedItems = items.map((item) =>
    calculateLineItemGST(item, supplierStateCode, recipientStateCode)
  );

  const subTotal = processedItems.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
  const totalDiscount = processedItems.reduce(
    (sum, item) => sum + (item.discount || 0),
    0
  );
  const totalTaxableAmount = processedItems.reduce(
    (sum, item) => sum + item.taxableAmount,
    0
  );
  const totalCGST = processedItems.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSGST = processedItems.reduce((sum, item) => sum + item.sgstAmount, 0);
  const totalIGST = processedItems.reduce((sum, item) => sum + item.igstAmount, 0);
  const totalCess = processedItems.reduce((sum, item) => sum + item.cessAmount, 0);

  const grandTotal = parseFloat(
    (totalTaxableAmount + totalCGST + totalSGST + totalIGST + totalCess).toFixed(2)
  );

  const roundedTotal = Math.round(grandTotal);
  const roundOff = parseFloat((roundedTotal - grandTotal).toFixed(2));

  return {
    items: processedItems,
    subTotal: parseFloat(subTotal.toFixed(2)),
    totalDiscount: parseFloat(totalDiscount.toFixed(2)),
    totalTaxableAmount: parseFloat(totalTaxableAmount.toFixed(2)),
    totalCGST: parseFloat(totalCGST.toFixed(2)),
    totalSGST: parseFloat(totalSGST.toFixed(2)),
    totalIGST: parseFloat(totalIGST.toFixed(2)),
    totalCess: parseFloat(totalCess.toFixed(2)),
    roundOff,
    grandTotal: roundedTotal,
  };
};

/**
 * Convert number to Indian words (for invoice amount in words)
 */
const numberToWords = (num) => {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  const numToWords = (n) => {
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000)
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000)
      return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000)
      return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let words = numToWords(rupees) + ' Rupees';
  if (paise > 0) {
    words += ' and ' + numToWords(paise) + ' Paise';
  }
  words += ' Only';

  return words;
};

module.exports = {
  GST_RATES,
  isInterState,
  calculateLineItemGST,
  calculateInvoiceTotals,
  numberToWords,
};