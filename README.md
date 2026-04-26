# TestApp

A simple test application to validate the pipeline with comprehensive unit test suites.

## Project Structure

```
testapp/
├── backend/                 # Express.js REST API
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── tests/
│   │   ├── unit/            # Unit tests
│   │   ├── integration/     # Integration tests
│   │   └── factories/       # Test data factories
│   ├── jest.config.js       # Jest configuration
│   └── package.json
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   └── test/            # Test utilities
│   ├── vitest.config.ts     # Vitest configuration
│   └── package.json
├── .github/workflows/       # CI/CD workflows
└── TESTS.md                # Test documentation
```

## Quick Start

### Backend

```bash
cd backend
npm install
npm run dev        # Development server
npm test           # Run tests
npm run test:coverage  # Run tests with coverage
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Development server
npm test           # Run tests
npm run test:coverage  # Run tests with coverage
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/health/ready` | Readiness probe |
| GET | `/api/v1/health/live` | Liveness probe |
| GET | `/api/v1/info` | API information |
| GET | `/api/v1/info/endpoints` | Available endpoints |
| GET | `/api/v1/info/versions` | API versions |

## Test Coverage

See [TESTS.md](./TESTS.md) for detailed test documentation.

| Component | Target | Status |
|-----------|--------|--------|
| Backend Controllers | 90% | ✅ |
| Backend Services | 85% | ✅ |
| Backend Middleware | 85% | ✅ |
| Frontend Components | 85% | ✅ |
| Frontend Hooks | 90% | ✅ |
| **Overall** | **80%** | ✅ |

## CI/CD

Tests run automatically via GitHub Actions on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Jest
- **Frontend**: React, TypeScript, Vite, Vitest
- **Testing**: Jest (backend), Vitest + React Testing Library (frontend)
- **CI/CD**: GitHub Actions

## License

MIT
