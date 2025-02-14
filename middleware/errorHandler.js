// middleware/errorHandler.js

function errorHandler(err, req, res, next) {
    // Log the error stack for debugging
    console.error(err.stack);

    // Set the status code (default to 500 if not set) and send the error message
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
        },
    });
}

module.exports = errorHandler;
