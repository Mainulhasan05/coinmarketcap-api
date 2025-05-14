# Cryptocurrency API with Express.js and TypeScript

This project implements a cryptocurrency data API using Express.js and TypeScript, integrated with the CoinMarketCap API.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following content:

   ```
   PORT=3000
   NODE_ENV=development
   COINMARKETCAP_API_KEY=your_api_key_here
   ```

   Replace `your_api_key_here` with your actual CoinMarketCap API key.

4. Build the TypeScript code:
   ```bash
   npm run build
   ```
5. Start the server:
   ```bash
   npm start
   ```

## Available Endpoints

### Get all cryptocurrency data

```
GET /api/cryptocurrencies
```

Query parameters:

- `start` (default: 1): Starting position
- `limit` (default: 100): Number of results to return
- `sort` (default: market_cap): Sort by field
- `sort_dir` (default: desc): Sort direction, 'asc' or 'desc'
- `convert` (default: USD): Currency to convert to
- `price_min`, `price_max`: Filter by price range
- `market_cap_min`, `market_cap_max`: Filter by market cap range
- `volume_24h_min`, `volume_24h_max`: Filter by 24h volume range
- `percent_change_24h_min`, `percent_change_24h_max`: Filter by 24h percent change range
- `cryptocurrency_type`: Filter by cryptocurrency type
- `tag`: Filter by tag

### Get trending cryptocurrencies

```
GET /api/cryptocurrencies/trending
```

### Get gainers and losers

```
GET /api/cryptocurrencies/gainers
```

Query parameters:

- `time_period` (default: 24h): Time period for calculating gains/losses
- `limit` (default: 10): Number of results to return

### Get cryptocurrency data for a specific time period

```
GET /api/cryptocurrencies/time-period/:period
```

Path parameters:

- `period`: '5m', '1h', '6h', or '24h'

Query parameters:

- `limit` (default: 100): Number of results to return

### Master endpoint with all filters

```
GET /api/cryptocurrencies/master
```

Query parameters:

- `page` (default: 1): Page number
- `limit` (default: 10): Number of results per page
- `filter` (default: all): Filter type, one of 'all', 'gainers', 'losers', 'trending'
- `sortBy` (default: market_cap): Sort by field, one of 'market_cap', 'price', 'volume_24h', 'percent_change'
- `sortPeriod` (default: 24h): Sort period, one of '1h', '24h', '7d', '30d'
- `sortDirection` (default: desc): Sort direction, 'asc' or 'desc'
- `search`: Search term for filtering by name or symbol

Example:

```
GET /api/cryptocurrencies/master?page=1&limit=10&filter=gainers&sortBy=market_cap&sortPeriod=24h&sortDirection=desc&search=bit
```

### Health check

```
GET /health
```

## Project Structure

```
.
├── config/
│   └── envConfig.ts
├── middleware/
│   └── errorHandler.ts
├── services/
│   └── cryptocurrencies/
│       ├── api/
│       │   └── coinMarketCapApi.ts
│       ├── controller/
│       │   └── cryptocurrenciesController.ts
│       └── route/
│           └── cryptocurrenciesRoutes.ts
├── types/
│   └── cryptocurrency.ts
├── index.ts
├── package.json
└── tsconfig.json
```
