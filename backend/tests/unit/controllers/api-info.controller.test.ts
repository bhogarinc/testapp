/**
 * API Info Controller Unit Tests
 * 
 * Tests for the API information and metadata endpoint.
 */

import { Request, Response } from 'express';
import { ApiInfoController } from '../../../src/controllers/api-info.controller';
import { ApiInfoService } from '../../../src/services/api-info.service';

jest.mock('../../../src/services/api-info.service');

describe('ApiInfoController', () => {
  let controller: ApiInfoController;
  let mockApiInfoService: jest.Mocked<ApiInfoService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockApiInfoService = new ApiInfoService() as jest.Mocked<ApiInfoService>;
    controller = new ApiInfoController(mockApiInfoService);
    
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      headers: {},
      query: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('GET /api/v1/info', () => {
    it('should return 200 with API information', async () => {
      const apiInfo = {
        name: 'TestApp API',
        version: '1.0.0',
        description: 'A simple test application API',
        environment: 'test',
        baseUrl: '/api/v1',
        documentation: '/api/v1/docs',
      };
      mockApiInfoService.getApiInfo.mockReturnValue(apiInfo);

      await controller.getApiInfo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(apiInfo);
    });

    it('should include all required API metadata fields', async () => {
      mockApiInfoService.getApiInfo.mockReturnValue({
        name: 'TestApp API',
        version: '1.0.0',
        description: 'Test API',
        environment: 'test',
        baseUrl: '/api/v1',
        documentation: '/api/v1/docs',
      });

      await controller.getApiInfo(
        mockRequest as Request,
        mockResponse as Response
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response).toHaveProperty('name');
      expect(response).toHaveProperty('version');
      expect(response).toHaveProperty('description');
      expect(response).toHaveProperty('environment');
      expect(response).toHaveProperty('baseUrl');
      expect(response).toHaveProperty('documentation');
    });

    it('should return semantic version format', async () => {
      mockApiInfoService.getApiInfo.mockReturnValue({
        name: 'TestApp API',
        version: '2.1.3',
        description: 'Test API',
        environment: 'test',
        baseUrl: '/api/v1',
        documentation: '/api/v1/docs',
      });

      await controller.getApiInfo(
        mockRequest as Request,
        mockResponse as Response
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should handle service errors gracefully', async () => {
      mockApiInfoService.getApiInfo.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      await controller.getApiInfo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });
  });

  describe('GET /api/v1/info/endpoints', () => {
    it('should return list of available endpoints', async () => {
      const endpoints = [
        { path: '/health', methods: ['GET'], description: 'Health check' },
        { path: '/info', methods: ['GET'], description: 'API information' },
      ];
      mockApiInfoService.getEndpoints.mockReturnValue(endpoints);

      await controller.getEndpoints(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ endpoints });
    });

    it('should include endpoint metadata', async () => {
      mockApiInfoService.getEndpoints.mockReturnValue([
        {
          path: '/health',
          methods: ['GET'],
          description: 'Health check endpoint',
          auth: false,
        },
      ]);

      await controller.getEndpoints(
        mockRequest as Request,
        mockResponse as Response
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.endpoints[0]).toMatchObject({
        path: expect.any(String),
        methods: expect.any(Array),
        description: expect.any(String),
      });
    });
  });

  describe('GET /api/v1/info/versions', () => {
    it('should return supported API versions', async () => {
      const versions = ['v1'];
      mockApiInfoService.getVersions.mockReturnValue(versions);

      await controller.getVersions(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ versions });
    });

    it('should return array of version strings', async () => {
      mockApiInfoService.getVersions.mockReturnValue(['v1', 'v2']);

      await controller.getVersions(
        mockRequest as Request,
        mockResponse as Response
      );

      const response = jsonMock.mock.calls[0][0];
      expect(response.versions).toBeInstanceOf(Array);
      response.versions.forEach((version: string) => {
        expect(typeof version).toBe('string');
      });
    });
  });
});
