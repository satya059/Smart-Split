export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Prisma errors
    if (err.code === 'P2002') {
        return res.status(400).json({
            error: 'A record with this value already exists'
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            error: 'Record not found'
        });
    }

    // Zod validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.errors
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
};

export class AppError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
        this.name = 'AppError';
    }
}
