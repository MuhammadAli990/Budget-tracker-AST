// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Default error response
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred.';
    const data = err.data || { error: err.message };

    return res.status(statusCode).json({
        success: false,
        message,
        data,
    });
};
