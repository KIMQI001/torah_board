"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
class ResponseUtil {
    static success(res, data, message) {
        const response = {
            success: true,
            data,
            message
        };
        return res.json(response);
    }
    static error(res, message, statusCode = 400) {
        const response = {
            success: false,
            error: message
        };
        return res.status(statusCode).json(response);
    }
    static paginated(res, data, pagination, message) {
        const response = {
            success: true,
            data,
            message,
            pagination: {
                ...pagination,
                totalPages: Math.ceil(pagination.total / pagination.limit)
            }
        };
        return res.json(response);
    }
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }
    static notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }
    static serverError(res, message = 'Internal server error') {
        return this.error(res, message, 500);
    }
}
exports.ResponseUtil = ResponseUtil;
//# sourceMappingURL=response.js.map