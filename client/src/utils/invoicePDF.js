// ============================================================
// GST IMS - Invoice PDF Generator
// Generates professional A4 GST tax invoice PDFs
// ============================================================

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency, formatDate, numberToWords } from './formatters';

// ============================================================
// APPROACH 1: Generate PDF from DOM element (pixel-perfect)
// Best for: matching the on-screen preview exactly
// ============================================================

/**
 * Download invoice PDF from a DOM element
 * @param {string} elementId - ID of the preview container
 * @param {string} filename - Filename without .pdf extension
 */
export const downloadInvoicePDFFromElement = async (elementId, filename) => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return false;
  }

  try {
    // Render DOM to canvas (2x scale for crisp output)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Create PDF in A4 size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, '', 'FAST');
    heightLeft -= pageHeight;

    // Add additional pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    return false;
  }
};

// ============================================================
// APPROACH 2: Generate PDF programmatically with jsPDF + autoTable
// Best for: smaller file size, searchable text, no DOM dependency
// ============================================================

/**
 * Generate a professional GST invoice PDF from invoice data
 * @param {Object} invoice - The invoice object
 * @param {Object} user - The current user (business owner)
 * @returns {jsPDF} The generated PDF document
 */
export const generateInvoicePDF = (invoice, user) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let yPos = margin;

  // ============================================================
  // COLORS
  // ============================================================
  const primaryBlue = [37, 99, 235]; // #2563eb
  const darkGray = [17, 24, 39];     // #111827
  const midGray = [75, 85, 99];      // #4b5563
  const lightGray = [243, 244, 246]; // #f3f4f6
  const borderGray = [229, 231, 235]; // #e5e7eb

  // ============================================================
  // HEADER BAND (blue)
  // ============================================================
  doc.setFillColor(...primaryBlue);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Company Name (left)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(user?.businessName || 'Your Business', margin, 14);

  // GSTIN + address
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const addr = user?.address || {};
  const addrLine = [addr.street, addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(', ');
  doc.text(`GSTIN: ${user?.gstin || 'N/A'}`, margin, 20);
  doc.text(addrLine || 'India', margin, 25);

  // TAX INVOICE title (right)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth - margin, 15, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - margin, 21, {
    align: 'right',
  });
  doc.text(
    `Date: ${formatDate(invoice.invoiceDate)}`,
    pageWidth - margin,
    26,
    { align: 'right' }
  );

  yPos = 40;

  // ============================================================
  // BILL TO / SHIP TO SECTION
  // ============================================================
  const colWidth = (pageWidth - margin * 2 - 6) / 2;

  // Bill To box
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, yPos, colWidth, 32, 2, 2, 'F');

  doc.setTextColor(...midGray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin + 3, yPos + 5);

  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    invoice.clientDetails?.name || 'N/A',
    margin + 3,
    yPos + 11
  );

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...midGray);
  let billY = yPos + 16;

  if (invoice.clientDetails?.gstin) {
    doc.text(`GSTIN: ${invoice.clientDetails.gstin}`, margin + 3, billY);
    billY += 4;
  }

  const billingAddr = invoice.clientDetails?.billingAddress || {};
  const billAddrLine1 = [billingAddr.street, billingAddr.city]
    .filter(Boolean)
    .join(', ');
  const billAddrLine2 = [billingAddr.state, billingAddr.pincode]
    .filter(Boolean)
    .join(' - ');

  if (billAddrLine1) {
    doc.text(billAddrLine1, margin + 3, billY, { maxWidth: colWidth - 6 });
    billY += 4;
  }
  if (billAddrLine2) {
    doc.text(billAddrLine2, margin + 3, billY, { maxWidth: colWidth - 6 });
  }

  // Ship To / Invoice Details box
  const shipX = margin + colWidth + 6;
  doc.setFillColor(...lightGray);
  doc.roundedRect(shipX, yPos, colWidth, 32, 2, 2, 'F');

  doc.setTextColor(...midGray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS', shipX + 3, yPos + 5);

  doc.setTextColor(...darkGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice Date: ${formatDate(invoice.invoiceDate)}`, shipX + 3, yPos + 11);
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, shipX + 3, yPos + 16);
  doc.text(
    `Place of Supply: ${invoice.placeOfSupply?.state || 'N/A'}`,
    shipX + 3,
    yPos + 21
  );
  doc.text(
    `Type: ${invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}`,
    shipX + 3,
    yPos + 26
  );

  yPos += 40;

  // ============================================================
  // LINE ITEMS TABLE
  // ============================================================
  const tableColumns = [
    { header: '#', dataKey: 'sr' },
    { header: 'Description', dataKey: 'name' },
    { header: 'HSN/SAC', dataKey: 'hsnCode' },
    { header: 'Qty', dataKey: 'quantity' },
    { header: 'Rate', dataKey: 'rate' },
    { header: 'Taxable', dataKey: 'taxable' },
    { header: 'GST%', dataKey: 'gstRate' },
    { header: 'CGST', dataKey: 'cgst' },
    { header: 'SGST', dataKey: 'sgst' },
    { header: 'IGST', dataKey: 'igst' },
    { header: 'Total', dataKey: 'total' },
  ];

  const tableRows = (invoice.items || []).map((item, index) => ({
    sr: index + 1,
    name: item.name,
    hsnCode: item.hsnCode,
    quantity: `${item.quantity} ${item.unit || ''}`.trim(),
    rate: formatCurrency(item.rate, false),
    taxable: formatCurrency(item.taxableAmount, false),
    gstRate: `${item.gstRate}%`,
    cgst: item.cgstAmount ? formatCurrency(item.cgstAmount, false) : '—',
    sgst: item.sgstAmount ? formatCurrency(item.sgstAmount, false) : '—',
    igst: item.igstAmount ? formatCurrency(item.igstAmount, false) : '—',
    total: formatCurrency(item.totalAmount, false),
  }));

  doc.autoTable({
    startY: yPos,
    head: [tableColumns.map((c) => c.header)],
    body: tableRows.map((row) => tableColumns.map((c) => row[c.dataKey])),
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: borderGray,
      lineWidth: 0.1,
      textColor: darkGray,
      valign: 'middle',
    },
    headStyles: {
      fillColor: primaryBlue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2.5,
    },
    bodyStyles: {
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
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    margin: { left: margin, right: margin },
  });

  yPos = doc.lastAutoTable.finalY + 6;

  // ============================================================
  // TOTALS SECTION (right-aligned box)
  // ============================================================
  const totalsWidth = 80;
  const totalsX = pageWidth - margin - totalsWidth;

  // Build totals rows
  const totalsRows = [
    { label: 'Sub Total', value: formatCurrency(invoice.subTotal, false) },
  ];

  if (invoice.totalDiscount > 0) {
    totalsRows.push({
      label: 'Discount',
      value: `- ${formatCurrency(invoice.totalDiscount, false)}`,
    });
  }

  totalsRows.push({
    label: 'Taxable Amount',
    value: formatCurrency(invoice.totalTaxableAmount, false),
  });

  if (invoice.totalCGST > 0) {
    totalsRows.push({
      label: 'CGST',
      value: formatCurrency(invoice.totalCGST, false),
    });
  }
  if (invoice.totalSGST > 0) {
    totalsRows.push({
      label: 'SGST',
      value: formatCurrency(invoice.totalSGST, false),
    });
  }
  if (invoice.totalIGST > 0) {
    totalsRows.push({
      label: 'IGST',
      value: formatCurrency(invoice.totalIGST, false),
    });
  }
  if (invoice.totalCess > 0) {
    totalsRows.push({
      label: 'Cess',
      value: formatCurrency(invoice.totalCess, false),
    });
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  let ty = yPos;
  totalsRows.forEach((row) => {
    doc.setTextColor(...midGray);
    doc.text(row.label, totalsX, ty);
    doc.setTextColor(...darkGray);
    doc.text(row.value, pageWidth - margin, ty, { align: 'right' });
    ty += 5;
  });

  // Grand Total (highlighted)
  ty += 1;
  doc.setFillColor(...primaryBlue);
  doc.rect(totalsX - 2, ty - 4, totalsWidth + 2, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', totalsX, ty + 1.5);
  doc.text(
    formatCurrency(invoice.grandTotal, false),
    pageWidth - margin,
    ty + 1.5,
    { align: 'right' }
  );

  yPos = ty + 12;

  // ============================================================
  // AMOUNT IN WORDS
  // ============================================================
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...midGray);

  const words =
    invoice.amountInWords || numberToWords(invoice.grandTotal);

  doc.text('Amount in words:', margin, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text(words, margin + 25, yPos, { maxWidth: pageWidth - margin * 2 - 25 });

  yPos += 10;

  // ============================================================
  // NOTES & TERMS (left) + BANK DETAILS (right)
  // ============================================================
  const footerY = pageHeight - 55;

  // Notes & Terms (left)
  if (invoice.notes || invoice.terms) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);

    if (invoice.notes) {
      doc.text('Notes:', margin, footerY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...midGray);
      doc.text(invoice.notes, margin, footerY + 4, {
        maxWidth: 100,
      });
    }

    if (invoice.terms) {
      const termsY = invoice.notes ? footerY + 12 : footerY;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGray);
      doc.text('Terms & Conditions:', margin, termsY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...midGray);
      doc.text(invoice.terms, margin, termsY + 4, {
        maxWidth: 100,
      });
    }
  }

  // Bank Details (right)
  const bank = user?.bankDetails;
  if (bank && bank.bankName) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Bank Details:', pageWidth / 2 + 20, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...midGray);
    let by = footerY + 4;

    if (bank.accountName) {
      doc.text(`A/C Name: ${bank.accountName}`, pageWidth / 2 + 20, by);
      by += 4;
    }
    if (bank.accountNumber) {
      doc.text(`A/C No: ${bank.accountNumber}`, pageWidth / 2 + 20, by);
      by += 4;
    }
    if (bank.bankName) {
      doc.text(`Bank: ${bank.bankName}`, pageWidth / 2 + 20, by);
      by += 4;
    }
    if (bank.ifscCode) {
      doc.text(`IFSC: ${bank.ifscCode}`, pageWidth / 2 + 20, by);
      by += 4;
    }
    if (bank.branch) {
      doc.text(`Branch: ${bank.branch}`, pageWidth / 2 + 20, by);
    }
  }

  // ============================================================
  // SIGNATURE
  // ============================================================
  const sigY = pageHeight - 22;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...midGray);
  doc.text(`For ${user?.businessName || 'Your Business'}`, pageWidth - margin, sigY, {
    align: 'right',
  });

  doc.setDrawColor(...midGray);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 45, sigY + 12, pageWidth - margin, sigY + 12);

  doc.setFontSize(7);
  doc.text('Authorised Signatory', pageWidth - margin, sigY + 16, {
    align: 'right',
  });

  // ============================================================
  // FOOTER (page number + computer-generated note)
  // ============================================================
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

/**
 * Download the invoice PDF directly
 * @param {Object} invoice
 * @param {Object} user
 */
export const downloadInvoicePDF = (invoice, user) => {
  const doc = generateInvoicePDF(invoice, user);
  doc.save(`${invoice.invoiceNumber}.pdf`);
  return true;
};

/**
 * Open the invoice PDF in a new browser tab (for print preview)
 */
export const printInvoicePDF = (invoice, user) => {
  const doc = generateInvoicePDF(invoice, user);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

/**
 * Get a data URL from the invoice PDF (for embedding)
 */
export const getInvoicePDFDataURL = (invoice, user) => {
  const doc = generateInvoicePDF(invoice, user);
  return doc.output('datauristring');
};

/**
 * Send PDF via WhatsApp (share link)
 */
export const shareInvoicePDF = (invoice, user) => {
  const doc = generateInvoicePDF(invoice, user);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  // Trigger download (browser limitation - can't share file directly)
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.invoiceNumber}.pdf`;
  a.click();

  URL.revokeObjectURL(url);
};

// ============================================================
// DEFAULT EXPORT
// ============================================================
export default {
  generateInvoicePDF,
  downloadInvoicePDF,
  downloadInvoicePDFFromElement,
  printInvoicePDF,
  getInvoicePDFDataURL,
  shareInvoicePDF,
};