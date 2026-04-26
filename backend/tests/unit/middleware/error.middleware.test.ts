/**
 * Error Middleware Unit Tests
 * 
 * Tests for global error handling middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { errorMiddleware, notFoundMiddleware } from '../../../src/middleware/error.middleware';
import { AppError, ValidationError, NotFoundError } from '../../../src/utils/errors';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      headers: {},
      query: {},
      body: {},
      path: '/test',
      method: 'GET',
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
      locals: {},
    };
    
    nextFunction = jest.fn();
  });

  describe('errorMiddleware', () => {
    it('should handle AppError with correct status code', () => {
      const error = new AppError('Test error', 400);
      
      errorMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
          statusCode: 400,
        })
      );
    });

    it('should handle ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid input', [
        { field: 'email', message: 'Invalid email format' },
      ]);
      
      errorMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid input',
          details: expect.any(Array),
        })
      );
    });

    it('should handle NotFoundError with 404 status', () => {
      const error = new NotFoundError('Resource not found');
      
      errorMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Resource not found',
        })
      );
    });

    it('should handle generic Error with 500 status', () => {
      const error = new Error('Unexpected error');
      
      errorMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
        })
      );
    });

    it('should include timestamp in error response', () => {
      const error = new AppError('Test error', 400);
      
      errorMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty('timestamp');
      expect(new Date(response.timestamp)).toBeInstanceOf(Date);
    });

    it('should include request path in error response', () => {
      const error = new AppError('Test error', 400);
      
      errorMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.path).toBe('/test');
    });

    it('should not leak stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      
      errorMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).not.toHaveProperty('stack');
      
      process.env.NODE_ENV = 'test';
    });

    it('should include stack trace in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      
      errorMiddleware(
        error,
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty('stack');
      
      process.env.NODE_ENV = 'test';
    });
  });

  describe('notFoundMiddleware', () => {
    it('should return 404 for undefined routes', () => {
      notFoundMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Not Found',
          message: expect.stringContaining('/test'),
        })
      );
    });

    it('should include available endpoints in response', () => {
      notFoundMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty('availableEndpoints');
      expect(response.availableEndpoints).toBeInstanceOf(Array);
    });
  });
});
