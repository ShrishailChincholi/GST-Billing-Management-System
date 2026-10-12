import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate, numberToWords } from './formatters';

// ============================================================
// Helper: Format amount for PDF (no ₹ symbol — use "Rs.")
// jsPDF default font can't render ₹ properly
// ============================================================
const formatAmount = (amount) => {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// ============================================================
// CASH BILL — Thermal-style (80mm)
// ============================================================
export const generateCashBillPDF = (bill, user) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200],
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 4;
  let y = 8;

  // ===== Company Header =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(user?.businessName || 'Your Shop', pageWidth / 2, y, {
    align: 'center',
  });
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

  // ===== Title =====
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CASH BILL', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // ===== Bill Info =====
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bill No: ${bill.billNumber}`, margin, y);
  doc.text(`Date: ${formatDate(bill.billDate)}`, pageWidth - margin, y, {
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

  // ===== Items Header =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Item', margin, y);
  doc.text('Qty', 42, y, { align: 'right' });
  doc.text('Rate', 54, y, { align: 'right' });
  doc.text('Amt', pageWidth - margin, y, { align: 'right' });
  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 3;

  // ===== Items =====
  doc.setFont('helvetica', 'normal');
  (bill.items || []).forEach((item) => {
    const name =
      item.name.length > 24 ? item.name.substring(0, 24) : item.name;
    const lines = doc.splitTextToSize(name, 38);
    lines.forEach((line, i) => {
      doc.text(line, margin, y + i * 3);
    });

    const nameHeight = lines.length * 3;
    doc.text(String(item.quantity), 42, y, { align: 'right' });
    doc.text(formatAmount(item.rate).replace('Rs. ', ''), 54, y, {
      align: 'right',
    });
    doc.text(
      formatAmount(item.rate * item.quantity).replace('Rs. ', ''),
      pageWidth - margin,
      y,
      { align: 'right' }
    );
    y += Math.max(nameHeight, 4);
  });

  y += 1;
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // ===== Total =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL', margin, y);
  doc.text(formatAmount(bill.grandTotal).replace('Rs. ', ''), pageWidth - margin, y, {
    align: 'right',
  });
  y += 5;

  // ===== Amount in Words =====
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  const words = doc.splitTextToSize(
    numberToWords(bill.grandTotal),
    pageWidth - 8
  );
  words.forEach((line) => {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 3;
  });

  y += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Payment: ${bill.paymentMode || 'CASH'}`, pageWidth / 2, y, {
    align: 'center',
  });
  y += 5;

  // ===== Footer =====
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
// GST BILL — Professional A4 Tax Invoice
// ============================================================
export const generateGSTBillPDF = (bill, user) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();   // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // ===== Colors =====
  const primaryBlue = [37, 99, 235];
  const darkGray = [17, 24, 39];
  const midGray = [75, 85, 99];
  const lightGray = [249, 250, 251];
  const borderGray = [229, 231, 235];

  let y = 0;

  // ============================================================
  // HEADER BAND (Blue)
  // ============================================================
  doc.setFillColor(...primaryBlue);
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Company Name (left)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(user?.businessName || 'Your Business', margin, 12);

  // Company details (left, below name)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  const addrLine = [
    user?.address?.street,
    user?.address?.city,
    user?.address?.state,
    user?.address?.pincode,
  ]
    .filter(Boolean)
    .join(', ');

  doc.text(`GSTIN: ${user?.gstin || 'N/A'}`, margin, 18);
  if (addrLine) doc.text(addrLine, margin, 23);
  if (user?.phone) doc.text(`Phone: ${user.phone}`, margin, 27);

  // TAX INVOICE (right)
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth - margin, 12, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bill No: ${bill.billNumber}`, pageWidth - margin, 19, {
    align: 'right',
  });
  doc.text(`Date: ${formatDate(bill.billDate)}`, pageWidth - margin, 24, {
    align: 'right',
  });

  y = 38;

  // ============================================================
  // BILL TO + INVOICE DETAILS (2 columns)
  // ============================================================
  const colGap = 6;
  const colWidth = (contentWidth - colGap) / 2;

  // ---- BILL TO (left) ----
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, y, colWidth, 30, 2, 2, 'F');

  doc.setTextColor(...midGray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin + 4, y + 6);

  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const customerName = bill.customerName || 'Walk-in Customer';
  doc.text(customerName, margin + 4, y + 12, {
    maxWidth: colWidth - 8,
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...midGray);
  let by = y + 17;

  if (bill.customerGstin) {
    doc.text(`GSTIN: ${bill.customerGstin}`, margin + 4, by);
    by += 4;
  }
  if (bill.customerPhone) {
    doc.text(`Phone: ${bill.customerPhone}`, margin + 4, by);
  }

  // ---- INVOICE DETAILS (right) ----
  const rightX = margin + colWidth + colGap;
  doc.setFillColor(...lightGray);
  doc.roundedRect(rightX, y, colWidth, 30, 2, 2, 'F');

  doc.setTextColor(...midGray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS', rightX + 4, y + 6);

  doc.setTextColor(...darkGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Mode: ${bill.paymentMode || 'CASH'}`, rightX + 4, y + 12);
  doc.text(
    `Place of Supply: ${user?.address?.state || 'N/A'}`,
    rightX + 4,
    y + 17
  );
  doc.text(
    `Type: ${
      bill.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'
    }`,
    rightX + 4,
    y + 22
  );
  doc.text('Bill Type: GST Tax Invoice', rightX + 4, y + 27);

  y += 38;

  // ============================================================
  // ITEMS TABLE
  // ============================================================
  const tableHead = [
    ['#', 'Description', 'HSN/SAC', 'Qty', 'Rate', 'Taxable', 'GST%', 'CGST', 'SGST', 'IGST', 'Total'],
  ];

  const tableBody = (bill.items || []).map((item, i) => [
    String(i + 1),
    item.name,
    item.hsnCode,
    `${item.quantity} ${item.unit || ''}`.trim(),
    item.rate.toFixed(2),
    item.taxableAmount.toFixed(2),
    `${item.gstRate}%`,
    item.cgstAmount ? item.cgstAmount.toFixed(2) : '—',
    item.sgstAmount ? item.sgstAmount.toFixed(2) : '—',
    item.igstAmount ? item.igstAmount.toFixed(2) : '—',
    item.totalAmount.toFixed(2),
  ]);

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      lineColor: borderGray,
      lineWidth: 0.1,
      textColor: darkGray,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: primaryBlue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
    },
    columnStyles: {
      0:  { cellWidth: 7,  halign: 'center' },
      1:  { cellWidth: 42, halign: 'left' },
      2:  { cellWidth: 16, halign: 'center' },
      3:  { cellWidth: 14, halign: 'center' },
      4:  { cellWidth: 18, halign: 'right' },
      5:  { cellWidth: 20, halign: 'right' },
      6:  { cellWidth: 12, halign: 'center' },
      7:  { cellWidth: 17, halign: 'right' },
      8:  { cellWidth: 17, halign: 'right' },
      9:  { cellWidth: 17, halign: 'right' },
      10: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [252, 252, 253],
    },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
  });

  y = doc.lastAutoTable.finalY + 6;

  // ============================================================
  // TOTALS (right aligned, above amount-in-words)
  // ============================================================
  const totalsBoxWidth = 78;
  const totalsX = pageWidth - margin - totalsBoxWidth;
  const totalsEndX = pageWidth - margin;

  // Build totals rows
  const totalsRows = [
    ['Sub Total', bill.subTotal],
    ['Taxable Amount', bill.totalTaxableAmount],
  ];

  if (bill.totalDiscount > 0) {
    totalsRows.push(['Discount', -bill.totalDiscount]);
  }
  if (bill.totalCGST > 0) {
    totalsRows.push(['CGST', bill.totalCGST]);
  }
  if (bill.totalSGST > 0) {
    totalsRows.push(['SGST', bill.totalSGST]);
  }
  if (bill.totalIGST > 0) {
    totalsRows.push(['IGST', bill.totalIGST]);
  }

  // Light gray background for totals box
  const totalsBoxHeight = totalsRows.length * 5 + 16;
  doc.setFillColor(...lightGray);
  doc.roundedRect(totalsX - 3, y - 3, totalsBoxWidth + 3, totalsBoxHeight, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  let ty = y + 3;

  totalsRows.forEach(([label, value]) => {
    doc.setTextColor(...midGray);
    doc.text(label, totalsX + 2, ty);
    doc.setTextColor(...darkGray);
    doc.text(
      value.toFixed(2),
      totalsEndX - 2,
      ty,
      { align: 'right' }
    );
    ty += 5;
  });

  // Grand Total (highlighted)
  ty += 2;
  doc.setFillColor(...primaryBlue);
  doc.rect(totalsX - 3, ty - 4, totalsBoxWidth + 3, 9, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', totalsX + 2, ty + 2);
  doc.text(
    formatAmount(bill.grandTotal).replace('Rs. ', ''),
    totalsEndX - 2,
    ty + 2,
    { align: 'right' }
  );

  y = ty + 14;

  // ============================================================
  // AMOUNT IN WORDS
  // ============================================================
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...midGray);
  doc.text('Amount in words:', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  const amountWords = numberToWords(bill.grandTotal);
  const wordsLines = doc.splitTextToSize(
    amountWords,
    contentWidth - 40
  );
  wordsLines.forEach((line, i) => {
    doc.text(line, margin + 32, y + i * 4);
  });

  y += wordsLines.length * 4 + 6;

  // ============================================================
  // NOTES & TERMS (optional)
  // ============================================================
  if (bill.notes) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...midGray);
    doc.text('Notes:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(bill.notes, margin + 12, y, {
      maxWidth: contentWidth - 12,
    });
  }

  // ============================================================
  // SIGNATURE (bottom right)
  // ============================================================
  const sigY = pageHeight - 25;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...midGray);
  doc.text(
    `For ${user?.businessName || 'Your Business'}`,
    pageWidth - margin,
    sigY,
    { align: 'right' }
  );

  doc.setDrawColor(...midGray);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 50, sigY + 14, pageWidth - margin, sigY + 14);

  doc.setFontSize(7);
  doc.text('Authorised Signatory', pageWidth - margin, sigY + 18, {
    align: 'right',
  });

  // ============================================================
  // FOOTER (bottom center)
  // ============================================================
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    'This is a computer-generated invoice and does not require a physical signature.',
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  return doc;
};

// ============================================================
// Public API
// ============================================================
export const downloadBillPDF = (bill, user, billType = 'GST') => {
  const doc =
    billType === 'CASH'
      ? generateCashBillPDF(bill, user)
      : generateGSTBillPDF(bill, user);
  doc.save(`${bill.billNumber}.pdf`);
  return true;
};

export const printBill = (bill, user, billType = 'GST') => {
  const doc =
    billType === 'CASH'
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