// Utility functions for form validation

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number
 * @returns {boolean} Is valid
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Validate required field
 * @param {any} value - Field value
 * @returns {boolean} Is valid
 */
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Validate number is positive
 * @param {number} value - Number value
 * @returns {boolean} Is valid
 */
export const isPositiveNumber = (value) => {
  return !isNaN(value) && parseFloat(value) > 0;
};

/**
 * Validate vehicle number format
 * @param {string} vehicleNumber - Vehicle number
 * @returns {boolean} Is valid
 */
export const isValidVehicleNumber = (vehicleNumber) => {
  // Indian vehicle number format: XX00XX0000
  const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
  return vehicleRegex.test(vehicleNumber.replace(/\s/g, '').toUpperCase());
};

/**
 * Validate license number
 * @param {string} licenseNumber - License number
 * @returns {boolean} Is valid
 */
export const isValidLicenseNumber = (licenseNumber) => {
  // Basic validation - at least 8 characters
  return licenseNumber.trim().length >= 8;
};

/**
 * Validate date is not in past
 * @param {string|number} date - Date value
 * @returns {boolean} Is valid
 */
export const isNotPastDate = (date) => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
};

/**
 * Validate end date is after start date
 * @param {string|number} startDate - Start date
 * @param {string|number} endDate - End date
 * @returns {boolean} Is valid
 */
export const isEndDateAfterStartDate = (startDate, endDate) => {
  return new Date(endDate) >= new Date(startDate);
};

/**
 * Validate form data
 * @param {Object} data - Form data
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result with errors
 */
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];
    
    if (fieldRules.required && !isRequired(value)) {
      errors[field] = `${field} is required`;
    } else if (fieldRules.email && value && !isValidEmail(value)) {
      errors[field] = 'Invalid email format';
    } else if (fieldRules.phone && value && !isValidPhone(value)) {
      errors[field] = 'Invalid phone number';
    } else if (fieldRules.positive && value && !isPositiveNumber(value)) {
      errors[field] = 'Must be a positive number';
    } else if (fieldRules.vehicleNumber && value && !isValidVehicleNumber(value)) {
      errors[field] = 'Invalid vehicle number format';
    } else if (fieldRules.licenseNumber && value && !isValidLicenseNumber(value)) {
      errors[field] = 'Invalid license number';
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
