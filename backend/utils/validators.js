// Validation utilities
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validateRequired = (fields, values) => {
    // fields: array of field names
    // values: object with field-value pairs
    const missing = fields.filter(field => !values[field]);
    return missing;
};

export const validatePositiveInteger = (value) => {
    const parsed = parseInt(value);
    return !Number.isNaN(parsed) && parsed > 0 ? parsed : null;
};
