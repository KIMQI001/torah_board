import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '@/types';

export class ResponseUtil {
  static success<T>(res: Response, data?: T, message?: string): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };
    return res.json(response);
  }

  static error(res: Response, message: string, statusCode: number = 400): Response {
    const response: ApiResponse = {
      success: false,
      error: message
    };
    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response, 
    data: T[], 
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string
  ): Response {
    const response: PaginatedResponse<T> = {
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

  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message: string = 'Resource not found'): Response {
    return this.error(res, message, 404);
  }

  static serverError(res: Response, message: string = 'Internal server error'): Response {
    return this.error(res, message, 500);
  }
}