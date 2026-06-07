// Standardized API response formatter
export const sendSuccess = (res, statusCode, message, data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

export const sendError = (res, statusCode, message, data = {}) => {
    return res.status(statusCode).json({
        success: false,
        message,
        data,
    });
};
