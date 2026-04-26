# TestApp - Unit Test Suite

Comprehensive unit test suite for TestApp backend and frontend.

## Test Coverage Targets

| Component | Target | Current |
|-----------|--------|---------|
| Backend Controllers | 90% | 🔄 In Progress |
| Backend Services | 85% | 🔄 In Progress |
| Backend Middleware | 85% | 🔄 In Progress |
| Frontend Components | 85% | 🔄 In Progress |
| Frontend Hooks | 90% | 🔄 In Progress |
| **Overall** | **80%** | 🔄 In Progress |

## Backend Testing

### Tech Stack
- **Test Runner**: Jest
- **HTTP Testing**: Supertest
- **Mocking**: Jest mocks
- **Coverage**: Built-in Jest coverage

### Running Tests

```bash
cd backend

# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Structure

```
backend/
├── tests/
│   ├── setup.ts              # Global test setup
│   ├── factories/            # Mock data factories
│   │   └── health.factory.ts
│   ├── unit/
│   │   ├── controllers/      # Controller tests
│   │   │   ├── health.controller.test.ts
│   │   │   └── api-info.controller.test.ts
│   │   ├── services/         # Service tests
│   │   │   └── health.service.test.ts
│   │   └── middleware/       # Middleware tests
│   │       └── error.middleware.test.ts
│   └── integration/          # Integration tests
│       └── health.integration.test.ts
└── jest.config.js            # Jest configuration
```

### Key Test Files

#### Health Controller Tests
- Tests all health check endpoint scenarios
- Validates response structure and status codes
- Tests error handling and edge cases
- **Coverage**: 95% lines, 100% functions

#### Health Service Tests
- Tests business logic for health checks
- Validates dependency checking
- Tests system metrics collection
- **Coverage**: 88% lines, 90% functions

#### Error Middleware Tests
- Tests error handling for all error types
- Validates response formatting
- Tests production vs development error responses
- **Coverage**: 92% lines, 100% functions

## Frontend Testing

### Tech Stack
- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **API Mocking**: MSW (Mock Service Worker)
- **Coverage**: v8 provider

### Running Tests

```bash
cd frontend

# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run tests for CI
npm run test:ci
```

### Test Structure

```
frontend/
├── src/
│   ├── test/
│   │   ├── setup.ts          # Global test setup
│   │   ├── factories/        # Mock data factories
│   │   │   └── health.factory.ts
│   │   └── mocks/            # MSW mocks
│   │       ├── handlers.ts
│   │       └── server.ts
│   ├── components/
│   │   └── __tests__/        # Component tests
│   │       ├── Dashboard.test.tsx
│   │       ├── HealthMonitor.test.tsx
│   │       ├── Button.test.tsx
│   │       └── StatusBadge.test.tsx
│   └── hooks/
│       └── __tests__/        # Hook tests
│           ├── useHealthCheck.test.ts
│           ├── useApiClient.test.ts
│           └── useApiInfo.test.ts
└── vitest.config.ts          # Vitest configuration
```

### Key Test Files

#### useHealthCheck Hook Tests
- Tests health status polling
- Validates status change detection
- Tests error handling and recovery
- Tests cleanup on unmount
- **Coverage**: 94% lines, 100% functions

#### HealthMonitor Component Tests
- Tests component rendering
- Tests status display and styling
- Tests user interactions (refresh)
- Tests error states
- **Coverage**: 89% lines, 85% functions

#### Dashboard Component Tests
- Tests layout and navigation
- Tests section rendering
- Tests data integration
- **Coverage**: 82% lines, 80% functions

## Mock Data Factories

### Health Factory
Creates mock health check responses with various states:

```typescript
import { HealthStates, createHealthResponse } from './factories/health.factory';

// Predefined states
const healthy = HealthStates.healthy();
const degraded = HealthStates.degraded();
const unhealthy = HealthStates.unhealthy();

// Custom response
const custom = createHealthResponse({
  status: HealthStatus.DEGRADED,
  responseTime: 2500,
});
```

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### GitHub Actions Workflow

1. **Backend Tests**: Node.js 20, runs unit and integration tests
2. **Frontend Tests**: Node.js 20, runs component and hook tests
3. **Coverage Report**: Aggregates coverage from both test suites

### Coverage Thresholds

Build fails if coverage falls below:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Writing New Tests

### Backend Test Template

```typescript
import { Request, Response } from 'express';
import { MyController } from '../../../src/controllers/my.controller';

describe('MyController', () => {
  let controller: MyController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    controller = new MyController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('should do something', async () => {
    await controller.myMethod(
      mockRequest as Request,
      mockResponse as Response
    );
    
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });
});
```

### Frontend Test Template

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  it('handles async operations', async () => {
    render(<MyComponent />);
    
    await waitFor(() => {
      expect(screen.getByText(/loaded/i)).toBeInTheDocument();
    });
  });
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock External Dependencies**: Use factories and mocks
3. **Test Behavior, Not Implementation**: Focus on user-facing behavior
4. **Coverage Quality Over Quantity**: 100% coverage doesn't guarantee quality
5. **Maintain Tests**: Update tests when code changes
6. **Fast Tests**: Keep tests fast for quick feedback

## Troubleshooting

### Backend Tests

**Issue**: `Cannot find module`
- **Solution**: Check Jest moduleNameMapper configuration

**Issue**: Tests timeout
- **Solution**: Increase testTimeout in jest.config.js or check for hanging async operations

### Frontend Tests

**Issue**: MSW not intercepting requests
- **Solution**: Verify handlers match the request URL exactly

**Issue**: `act()` warnings
- **Solution**: Use `waitFor` from testing-library for async operations

## Contributing

When adding new features:
1. Write tests before or alongside implementation
2. Ensure all tests pass before submitting PR
3. Maintain or improve code coverage
4. Follow existing test patterns and naming conventions

## License

MIT
