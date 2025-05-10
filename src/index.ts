import express, { Express } from 'express';
import cors from 'cors';
import envConfig from './config/envConfig.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import cryptocurrenciesRoutes from './services/cryptocurrencies/route/cryptocurrenciesRoutes.js';
// import dashboardRoutes from './services/dashboard-general/route/dashboardRoutes.js';

// Initialize Express app
const app: Express = express();
const PORT = envConfig.port;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// API Routes
app.use('/api/cryptocurrencies', cryptocurrenciesRoutes);
// app.use('/api', dashboardRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- http://localhost:${PORT}/api/cryptocurrencies (Get all cryptocurrency data)`);
  console.log(`- http://localhost:${PORT}/api/cryptocurrencies/BTC (Get specific cryptocurrency by symbol)`);
  console.log(`- http://localhost:${PORT}/api/trending (Get trending cryptocurrencies)`);
  console.log(`- http://localhost:${PORT}/api/gainers (Get gainers)`);
  console.log(`- http://localhost:${PORT}/api/time-period/5m (Get data for specific time period - 5m, 1h, 6h, 24h)`);
  console.log(`- http://localhost:${PORT}/api/master (Master API with pagination and filtering)`);
  console.log(`  Example: http://localhost:${PORT}/api/master?page=1&limit=10&filter=gainers&sortBy=market_cap&sortPeriod=24h&sortDirection=desc&search=bit`);
  console.log(`- http://localhost:${PORT}/health (Health check)`);
});

// For graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});