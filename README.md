# Cryptocurrency Dashboard API

This project is a backend API that consumes data from the CoinMarketCap API and exposes RESTful endpoints for a cryptocurrency dashboard frontend.

## Project Architecture

The project follows a modular structure with clear separation between routes, controllers, and services:

```
/server
├── src/
│   ├── index.ts                  # Main application entry point
│   ├── types/                    # Type definitions
│   ├── config/                   # Configuration files
│   ├── middleware/               # Express middleware
│   ├── utils/                    # Utility functions
│   └── services/                 # Services organized by domain
│       ├── cryptocurrencies/     # Cryptocurrency data service
│       │   ├── route/            # Routes for cryptocurrency data
│       │   └── controller/       # Controllers for cryptocurrency data
│       └── dashboard-general/    # Dashboard service
│           ├── route/            # Routes for dashboard
│           └── controller/       # Controllers for dashboard
```

## Technologies Used

- Node.js (20.16.0)
- TypeScript
- Express.js
- Axios for HTTP requests

## Prerequisites

- Node.js (20.16.0)
- npm (>=10.8.1)
- CoinMarketCap API key

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory based on `.env.example`:
   ```
   PORT=3000
   CMC_API_KEY=your_coinmarketcap_api_key_here
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

- **GET** `/health`
  - Returns the status of the API

### Cryptocurrency Data

- **GET** `/api/cryptocurrencies`
  - Returns all cryptocurrencies
- **GET** `/api/cryptocurrencies/:symbol`
  - Returns a specific cryptocurrency by symbol (e.g., BTC)

### Dashboard Data

- **GET** `/api/trending`
  - Returns cryptocurrencies sorted by 24h percent change
- **GET** `/api/gainers`
  - Returns cryptocurrencies with positive 24h percent change
- **GET** `/api/time-period/:period`
  - Returns cryptocurrencies sorted by the specified time period (5m, 1h, 6h, 24h)

### Master API (with filtering, sorting, and pagination)

- **GET** `/api/master`
  - Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Number of items per page (default: 10)
    - `filter`: Filter type ('trending', 'gainers', '5m', '1h', '6h', '24h')
    - `sortBy`: Sort field ('market_cap', 'price', 'volume_24h', 'percent_change')
    - `sortPeriod`: Time period for percent change sorting ('5m', '1h', '6h', '24h')
    - `sortDirection`: Sort direction ('asc', 'desc')
    - `search`: Search term for filtering by name or symbol

## Architecture Overview

### Data Flow

1. External API (CoinMarketCap) is called by the backend
2. Data is processed and transformed
3. RESTful endpoints expose the processed data for the frontend

### Error Handling

- Centralized error handling middleware
- Consistent error response format
- Custom error classes for different error types

### Validation

- Input validation for query parameters
- Error handling for invalid requests

## Notes for Improvement

- Add tests (unit, integration, and e2e)
- Implement caching to reduce API calls to CoinMarketCap
- Add rate limiting to protect the API
- Implement logging for better debugging
- Add authentication if required in the future
