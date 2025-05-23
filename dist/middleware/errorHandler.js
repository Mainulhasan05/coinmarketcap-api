/**
 * Global error handler middleware for consistent API error responses
 */
export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'An unexpected error occurred';
    console.error(`[ERROR] ${statusCode} - ${message}`);
    if (err.stack) {
        console.error(err.stack);
    }
    res.status(statusCode).json({
        status: {
            timestamp: new Date(),
            error_code: statusCode,
            error_message: message,
            code: errorCode,
        },
        data: null,
    });
};
/**
 * Custom API error class with status code and error code
 */
export class ApiError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'ApiError';
        Object.setPrototypeOf(this, ApiError.prototype);
    }
    static notFound(message = 'Resource not found') {
        return new ApiError(message, 404, 'NOT_FOUND');
    }
    static badRequest(message = 'Bad request') {
        return new ApiError(message, 400, 'BAD_REQUEST');
    }
    static unauthorized(message = 'Unauthorized') {
        return new ApiError(message, 401, 'UNAUTHORIZED');
    }
    static forbidden(message = 'Forbidden') {
        return new ApiError(message, 403, 'FORBIDDEN');
    }
    static tooManyRequests(message = 'Too many requests') {
        return new ApiError(message, 429, 'TOO_MANY_REQUESTS');
    }
    static internal(message = 'Internal server error') {
        return new ApiError(message, 500, 'INTERNAL_SERVER_ERROR');
    }
}
/**
 * Catch-all for unhandled routes - 404 Not Found
 */
export const notFoundHandler = (req, res, next) => {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
