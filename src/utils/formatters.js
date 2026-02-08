// Utility functions for formatting data

/**
 * Format date to readable string
 * @param {number|string|Date} date - Date value
 * @param {string} format - Format type (short, long, time)
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('en-IN');
  } else if (format === 'long') {
    return d.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } else if (format === 'time') {
    return d.toLocaleString('en-IN');
  } else if (format === 'input') {
    // Format for input type="date"
    return d.toISOString().split('T')[0];
  }
  
  return d.toLocaleDateString('en-IN');
};

/**
 * Format currency (Indian Rupees)
 * @param {number} amount - Amount value
 * @param {boolean} showSymbol - Show ₹ symbol
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined) return showSymbol ? '₹0.00' : '0.00';
  
  const formatted = parseFloat(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  return phone;
};

/**
 * Format vehicle number
 * @param {string} vehicleNumber - Vehicle number
 * @returns {string} Formatted vehicle number
 */
export const formatVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber) return '';
  
  const cleaned = vehicleNumber.replace(/\s/g, '').toUpperCase();
  
  // Format: XX 00 XX 0000
  if (cleaned.length >= 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
  }
  
  return cleaned;
};

/**
 * Get status badge color
 * @param {string} status - Status value
 * @returns {string} Tailwind color class
 */
export const getStatusColor = (status) => {
  const statusColors = {
    'Available': 'bg-green-100 text-green-800',
    'On Trip': 'bg-blue-100 text-blue-800',
    'Upcoming': 'bg-yellow-100 text-yellow-800',
    'Running': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'Present': 'bg-green-100 text-green-800',
    'Absent': 'bg-red-100 text-red-800',
    'Leave': 'bg-yellow-100 text-yellow-800'
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Calculate days between dates
 * @param {Date|string|number} startDate - Start date
 * @param {Date|string|number} endDate - End date
 * @returns {number} Number of days
 */
export const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get month name from date
 * @param {Date|string|number} date - Date value
 * @returns {string} Month name
 */
export const getMonthName = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
