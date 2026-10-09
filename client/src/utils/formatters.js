// ============================================================
// GST IMS - Formatters
// Centralized formatting utilities for the entire app
// ============================================================

// ============================================================
// CURRENCY FORMATTERS
// ============================================================

/**
 * Format a number as Indian Rupee currency
 * @param {number} amount - Amount to format
 * @param {boolean} showDecimals - Whether to show paise (default: true)
 * @returns {string} e.g. "₹1,23,456.78"
 */
export const formatCurrency = (amount, showDecimals = true) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
};

/**
 * Format currency without the ₹ symbol
 * @param {number} amount
 * @param {boolean} showDecimals
 * @returns {string} e.g. "1,23,456.78"
 */
export const formatNumber = (amount, showDecimals = true) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
};

/**
 * Compact currency (e.g. ₹1.2L, ₹45K, ₹2.3Cr)
 * Useful for dashboard cards where space is limited
 * @param {number} amount
 * @returns {string} e.g. "₹1.23L"
 */
export const formatCurrencyCompact = (amount) => {
  const num = Number(amount) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  }
  return `${sign}₹${abs.toFixed(0)}`;
};

/**
 * Format a number with Indian comma system (e.g. 12,34,567)
 * @param {number} num
 * @returns {string}
 */
export const formatIndianNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-IN');
};

// ============================================================
// DATE FORMATTERS
// ============================================================

/**
 * Format date as "15 Nov 2024"
 */
export const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format date as "15/11/2024"
 */
export const formatDateShort = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format date with weekday (e.g. "Friday, 15 November 2024")
 */
export const formatDateLong = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format date and time (e.g. "15 Nov 2024, 03:45 PM")
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format as YYYY-MM-DD (for input[type=date])
 */
export const formatDateInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ============================================================
// RELATIVE TIME (e.g. "2 days ago", "in 5 days")
// ============================================================

/**
 * Format relative time from now
 * @param {Date|string} date
 * @returns {string} "2 days ago" | "in 5 days" | "Today"
 */
export const formatRelativeTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');

  return formatDate(date);
};

/**
 * Get "days left until due" for invoices
 */
export const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((due - now) / (1000 * 60 * 60 * 24));
};

/**
 * Check if invoice is overdue
 */
export const isOverdue = (dueDate, status) => {
  if (!dueDate) return false;
  if (['PAID', 'CANCELLED', 'DRAFT'].includes(status)) return false;
  return new Date(dueDate) < new Date();
};

// ============================================================
// GST / TAX FORMATTERS
// ============================================================

/**
 * Format GST rate (e.g. "18%" or "0.25%")
 */
export const formatGSTRate = (rate) => {
  if (rate === null || rate === undefined) return '0%';
  return `${rate}%`;
};

/**
 * Format percentage
 */
export const formatPercent = (value, decimals = 1) => {
  const num = Number(value) || 0;
  return `${num.toFixed(decimals)}%`;
};

/**
 * Format GSTIN with spacing for readability
 * e.g. "27 AAPFU 0939F 1ZV"
 */
export const formatGSTIN = (gstin) => {
  if (!gstin) return '—';
  return gstin.toUpperCase();
};

/**
 * Mask GSTIN (for privacy display)
 * e.g. "27***0939***ZV"
 */
export const maskGSTIN = (gstin) => {
  if (!gstin || gstin.length !== 15) return gstin || '—';
  return `${gstin.slice(0, 2)}***${gstin.slice(7, 11)}***${gstin.slice(-2)}`;
};

/**
 * Validate GSTIN format
 */
export const isValidGSTIN = (gstin) => {
  if (!gstin) return false;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin.toUpperCase());
};

// ============================================================
// TEXT FORMATTERS
// ============================================================

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, length = 30) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.substring(0, length).trim()}...`;
};

/**
 * Get initials from a name (e.g. "Rajesh Kumar" → "RK")
 */
export const getInitials = (name, maxChars = 2) => {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, maxChars)
    .join('')
    .toUpperCase();
};

/**
 * Capitalize first letter of each word
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Convert status enum to pretty display (e.g. "PARTIALLY_PAID" → "Partially Paid")
 */
export const formatStatus = (status) => {
  if (!status) return '';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format file size (e.g. "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// ============================================================
// NUMBER TO INDIAN WORDS (for invoice "Amount in Words")
// ============================================================

/**
 * Convert number to Indian words (Rupees and Paise)
 * @param {number} amount - e.g. 123456.78
 * @returns {string} "One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees and Seventy Eight Paise Only"
 */
export const numberToWords = (amount) => {
  const num = Math.abs(Number(amount) || 0);
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy',
    'Eighty', 'Ninety',
  ];

  const convertBelowThousand = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    }
    return (
      ones[Math.floor(n / 100)] +
      ' Hundred' +
      (n % 100 ? ' ' + convertBelowThousand(n % 100) : '')
    );
  };

  const convertNumber = (n) => {
    if (n === 0) return 'Zero';

    let result = '';

    // Crores
    if (n >= 10000000) {
      result += convertBelowThousand(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }

    // Lakhs
    if (n >= 100000) {
      result += convertBelowThousand(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }

    // Thousands
    if (n >= 1000) {
      result += convertBelowThousand(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }

    // Below thousand
    if (n > 0) {
      result += convertBelowThousand(n);
    }

    return result.trim();
  };

  let words = '';
  if (rupees > 0) {
    words = `${convertNumber(rupees)} Rupees`;
  } else {
    words = 'Zero Rupees';
  }

  if (paise > 0) {
    words += ` and ${convertNumber(paise)} Paise`;
  }

  return `${words} Only`;
};

// ============================================================
// TABLE / LIST HELPERS
// ============================================================

/**
 * Get status badge class name
 */
export const getStatusBadgeClass = (status) => {
  const map = {
    DRAFT: 'badge-draft',
    ISSUED: 'badge-issued',
    PAID: 'badge-paid',
    PARTIALLY_PAID: 'badge-partially-paid',
    OVERDUE: 'badge-overdue',
    CANCELLED: 'badge-cancelled',
  };
  return map[status] || 'badge-draft';
};

/**
 * Get payment progress percentage
 */
export const getPaymentProgress = (paid, total) => {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
};

// ============================================================
// EXPORT ALL (in case someone prefers a single import)
// ============================================================

export default {
  formatCurrency,
  formatNumber,
  formatCurrencyCompact,
  formatIndianNumber,
  formatDate,
  formatDateShort,
  formatDateLong,
  formatDateTime,
  formatDateInput,
  formatRelativeTime,
  getDaysUntilDue,
  isOverdue,
  formatGSTRate,
  formatPercent,
  formatGSTIN,
  maskGSTIN,
  isValidGSTIN,
  truncate,
  getInitials,
  capitalize,
  formatStatus,
  formatFileSize,
  numberToWords,
  getStatusBadgeClass,
  getPaymentProgress,
};