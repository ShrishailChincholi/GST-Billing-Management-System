import jsPDF from 'jspdf';
import { formatCurrency, formatDate, numberToWords } from './formatters';

// ============================================================
// CASH BILL — Thermal-style (80mm) PDF
// ============================================================
export const generateCashBillPDF = (bill, user) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200], // 80mm thermal width
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 4;
  let y = 8;

  // Company
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(user?.businessName || 'Your Shop', pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  if (user?.address?.street) {
    doc.text(user.address.street, pageWidth / 2, y, { align: 'center' });
    y += 3;
  }
  const city = [user?.address?.city, user?.address?.state, user?.address?.pincode]
    .filter(Boolean)
    .join(', ');
  if (city) {
    doc.text(city, pageWidth / 2, y, { align: 'center' });
    y += 3;
  }
  if (user?.gstin) {
    doc.text(`GSTIN: ${user.gstin}`, pageWidth / 2, y, { align: 'center' });
    y += 3;
  }
  if (user?.phone) {
    doc.text(`Ph: ${user.phone}`, pageWidth / 2, y, { align: 'center' });
    y += 3;
  }

  y += 2;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDashPattern([], 0);
  y += 4;

  // Title
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CASH BILL', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Bill info
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bill No: ${bill.invoiceNumber}`, margin, y);
  doc.text(`Date: ${formatDate(bill.invoiceDate)}`, pageWidth - margin, y, {
    align: 'right',
  });
  y += 4;

  if (bill.customerName && bill.customerName !== 'Walk-in Customer') {
    doc.text(`Customer: ${bill.customerName}`, margin, y);
    y += 4;
  }

  y += 1;
  doc.line(margin, y, pageWidth - margin, y);
  y += 3;

  // Items header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Item', margin, y);
  doc.text('Qty', 42, y, { align: 'right' });
  doc.text('Rate', 54, y, { align: 'right' });
  doc.text('Amt', pageWidth - margin, y, { align: 'right' });
  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 3;

  // Items
  doc.setFont('helvetica', 'normal');
  (bill.items || []).forEach((item) => {
    const name = item.name.length > 24 ? item.name.substring(0, 24) : item.name;
    const lines = doc.splitTextToSize(name, 38);
    lines.forEach((line, i) => {
      doc.text(line, margin, y + i * 3);
    });

    const nameHeight = lines.length * 3;
    doc.text(String(item.quantity), 42, y, { align: 'right' });
    doc.text(formatCurrency(item.rate, false), 54, y, { align: 'right' });
    doc.text(
      formatCurrency(item.rate * item.quantity, false),
      pageWidth - margin,
      y,
      { align: 'right' }
    );
    y += Math.max(nameHeight, 4);
  });

  y += 1;
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL', margin, y);
  doc.text(formatCurrency(bill.grandTotal, false), pageWidth - margin, y, {
    align: 'right',
  });
  y += 5;

  // Amount in words
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  const words = doc.splitTextToSize(numberToWords(bill.grandTotal), pageWidth - 8);
  words.forEach((line) => {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 3;
  });

  y += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    `Payment: ${bill.paymentMode || 'CASH'}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 5;

  // Footer
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Thank you! Visit again', pageWidth / 2, y, { align: 'center' });
  y += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Goods once sold will not be taken back', pageWidth / 2, y, {
    align: 'center',
  });

  return doc;
};

// ============================================================
// GST BILL — A4 Tax Invoice PDF
// ============================================================
export const generateGSTBillPDF = (bill, user) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = margin;

  const primaryBlue = [37, 99, 235];
  const darkGray = [17, 24, 39];
  const midGray = [75, 85, 99];
  const lightGray = [243, 244, 246];
  const borderGray = [229, 231, 235];

  // Header band
  doc.setFillColor(...primaryBlue);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(user?.businessName || 'Your Business', margin, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const addr = user?.address || {};
  const addrLine = [addr.street, addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(', ');
  doc.text(`GSTIN: ${user?.gstin || 'N/A'}`, margin, 20);
  doc.text(addrLine || 'India', margin, 25);
  if (user?.phone) doc.text(`Phone: ${user.phone}`, margin, 29.5);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth - margin, 15, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bill #: ${bill.invoiceNumber}`, pageWidth - margin, 21, { align: 'right' });
  doc.text(`Date: ${formatDate(bill.invoiceDate)}`, pageWidth - margin, 26, { align: 'right' });

  y = 40;

  // Bill To
  const colWidth = (pageWidth - margin * 2 - 6) / 2;
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, y, colWidth, 32, 2, 2, 'F');

  doc.setTextColor(...midGray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin + 3, y + 5);

  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(bill.customerName || bill.clientDetails?.name || 'Walk-in Customer', margin + 3, y + 11);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...midGray);
  let by = y + 16;
  const customerGstin = bill.customerGstin || bill.clientDetails?.gstin;
  if (customerGstin) {
    doc.text(`GSTIN: ${customerGstin}`, margin + 3, by);
    by += 4;
  }
  if (bill.customerPhone) {
    doc.text(`Phone: ${bill.customerPhone}`, margin + 3, by);
    by += 4;
  }

  // Invoice details
  const shipX = margin + colWidth + 6;
  doc.setFillColor(...lightGray);
  doc.roundedRect(shipX, y, colWidth, 32, 2, 2, 'F');

  doc.setTextColor(...midGray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS', shipX + 3, y + 5);

  doc.setTextColor(...darkGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Mode: ${bill.paymentMode || 'CASH'}`, shipX + 3, y + 11);
  doc.text(`Place of Supply: ${user?.address?.state || 'N/A'}`, shipX + 3, y + 16);
  doc.text(
    `Type: ${bill.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}`,
    shipX + 3,
    y + 21
  );
  doc.text(`Bill Type: GST Tax Invoice`, shipX + 3, y + 26);

  y += 40;

  // Items table
  const cols = [
    { h: '#', k: 'sr' },
    { h: 'Description', k: 'name' },
    { h: 'HSN/SAC', k: 'hsnCode' },
    { h: 'Qty', k: 'qty' },
    { h: 'Rate', k: 'rate' },
    { h: 'Taxable', k: 'taxable' },
    { h: 'GST%', k: 'gstRate' },
    { h: 'CGST', k: 'cgst' },
    { h: 'SGST', k: 'sgst' },
    { h: 'IGST', k: 'igst' },
    { h: 'Total', k: 'total' },
  ];

  const rows = (bill.items || []).map((item, i) => ({
    sr: i + 1,
    name: item.name,
    hsnCode: item.hsnCode,
    qty: `${item.quantity} ${item.unit || ''}`.trim(),
    rate: formatCurrency(item.rate, false),
    taxable: formatCurrency(item.taxableAmount, false),
    gstRate: `${item.gstRate}%`,
    cgst: item.cgstAmount ? formatCurrency(item.cgstAmount, false) : '—',
    sgst: item.sgstAmount ? formatCurrency(item.sgstAmount, false) : '—',
    igst: item.igstAmount ? formatCurrency(item.igstAmount, false) : '—',
    total: formatCurrency(item.totalAmount, false),
  }));

  doc.autoTable({
    startY: y,
    head: [cols.map((c) => c.h)],
    body: rows.map((r) => cols.map((c) => r[c.k])),
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: borderGray, lineWidth: 0.1 },
    headStyles: {
      fillColor: primaryBlue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42 },
      2: { cellWidth: 18 },
      3: { cellWidth: 14, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 18, halign: 'right' },
      9: { cellWidth: 18, halign: 'right' },
      10: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 6;

  // Totals
  const totalsWidth = 80;
  const totalsX = pageWidth - margin - totalsWidth;

  const totalRows = [
    ['Sub Total', formatCurrency(bill.subTotal, false)],
    ['Taxable Amount', formatCurrency(bill.totalTaxableAmount, false)],
  ];
  if (bill.totalCGST > 0) totalRows.push(['CGST', formatCurrency(bill.totalCGST, false)]);
  if (bill.totalSGST > 0) totalRows.push(['SGST', formatCurrency(bill.totalSGST, false)]);
  if (bill.totalIGST > 0) totalRows.push(['IGST', formatCurrency(bill.totalIGST, false)]);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  totalRows.forEach(([label, val]) => {
    doc.setTextColor(...midGray);
    doc.text(label, totalsX, y);
    doc.setTextColor(...darkGray);
    doc.text(val, pageWidth - margin, y, { align: 'right' });
    y += 5;
  });

  y += 1;
  doc.setFillColor(...primaryBlue);
  doc.rect(totalsX - 2, y - 4, totalsWidth + 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', totalsX, y + 1.5);
  doc.text(formatCurrency(bill.grandTotal, false), pageWidth - margin, y + 1.5, {
    align: 'right',
  });

  y += 12;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...midGray);
  doc.text('Amount in words:', margin, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text(numberToWords(bill.grandTotal), margin + 25, y, {
    maxWidth: pageWidth - margin * 2 - 25,
  });

  // Signature
  const sigY = pageHeight - 22;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...midGray);
  doc.text(`For ${user?.businessName || 'Your Business'}`, pageWidth - margin, sigY, {
    align: 'right',
  });
  doc.setDrawColor(...midGray);
  doc.line(pageWidth - margin - 45, sigY + 12, pageWidth - margin, sigY + 12);
  doc.setFontSize(7);
  doc.text('Authorised Signatory', pageWidth - margin, sigY + 16, { align: 'right' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    'This is a computer-generated invoice and does not require a physical signature.',
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );

  return doc;
};

// ============================================================
// Public API
// ============================================================
export const downloadBillPDF = (bill, user, billType = 'GST') => {
  const doc = billType === 'CASH'
    ? generateCashBillPDF(bill, user)
    : generateGSTBillPDF(bill, user);
  doc.save(`${bill.invoiceNumber}.pdf`);
  return true;
};

export const printBill = (bill, user, billType = 'GST') => {
  const doc = billType === 'CASH'
    ? generateCashBillPDF(bill, user)
    : generateGSTBillPDF(bill, user);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

export default {
  generateCashBillPDF,
  generateGSTBillPDF,
  downloadBillPDF,
  printBill,
};