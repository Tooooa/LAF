exports.successResponse = (res, data, message = 'Success') => {
    return res.status(200).json({
        success: true,
        code: 200,
        message,
        data
    });
};

exports.errorResponse = (res, statusCode, message) => {
    return res.status(statusCode).json({
        success: false,
        code: statusCode,
        message
    });
};