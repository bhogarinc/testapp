/**
 * API Service
 * 
 * Service layer for API information.
 */

export interface ApiInfo {
  name: string;
  version: string;
  description: string;
  environment: string;
  baseUrl: string;
  documentation: string;
}

export interface EndpointInfo {
  path: string;
  methods: string[];
  description: string;
  auth?: boolean;
}

export class ApiInfoService {
  private readonly packageInfo: Record<string, any>;

  constructor() {
    this.packageInfo = {
      name: 'TestApp API',
      version: process.env.npm_package_version || '1.0.0',
      description: 'A simple test application API',
    };
  }

  getApiInfo(): ApiInfo {
    return {
      name: this.packageInfo.name,
      version: this.packageInfo.version,
      description: this.packageInfo.description,
      environment: process.env.NODE_ENV || 'development',
      baseUrl: '/api/v1',
      documentation: '/api/v1/docs',
    };
  }

  getEndpoints(): EndpointInfo[] {
    return [
      {
        path: '/health',
        methods: ['GET'],
        description: 'Health check endpoint',
        auth: false,
      },
      {
        path: '/health/ready',
        methods: ['GET'],
        description: 'Readiness probe',
        auth: false,
      },
      {
        path: '/health/live',
        methods: ['GET'],
        description: 'Liveness probe',
        auth: false,
      },
      {
        path: '/info',
        methods: ['GET'],
        description: 'API information',
        auth: false,
      },
      {
        path: '/info/endpoints',
        methods: ['GET'],
        description: 'Available endpoints',
        auth: false,
      },
      {
        path: '/info/versions',
        methods: ['GET'],
        description: 'Supported API versions',
        auth: false,
      },
    ];
  }

  getVersions(): string[] {
    return ['v1'];
  }
}
