// src/index.ts
import express, { Express } from 'express';
import cors from 'cors';
import envConfig from './config/envConfig.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import cryptocurrenciesRoutes from './services/cryptocurrencies/route/cryptocurrenciesRoutes.js';

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

// Additional routes based on your console.log statements
app.use('/api/trending', (req, res) => {
  res.redirect('/api/cryptocurrencies/trending');
});

app.use('/api/gainers', (req, res) => {
  res.redirect('/api/cryptocurrencies/gainers');
});

app.use('/api/time-period/:period', (req, res) => {
  res.redirect(`/api/cryptocurrencies/time-period/${req.params.period}`);
});

app.use('/api/master', (req, res) => {
  res.redirect('/api/cryptocurrencies/master');
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- http://localhost:${PORT}/api/cryptocurrencies (Get all cryptocurrency data)`);
  console.log(`- http://localhost:${PORT}/api/cryptocurrencies/trending (Get trending cryptocurrencies)`);
  console.log(`- http://localhost:${PORT}/api/cryptocurrencies/gainers (Get gainers and losers)`);
  console.log(`- http://localhost:${PORT}/api/cryptocurrencies/time-period/:period (Get data for specific time period - 5m, 1h, 6h, 24h)`);
  console.log(`- http://localhost:${PORT}/api/cryptocurrencies/master (Master endpoint with all filters)`);
  console.log(`  Example: http://localhost:${PORT}/api/cryptocurrencies/master?page=1&limit=10&filter=gainers&sortBy=market_cap&sortPeriod=24h&sortDirection=desc&search=bit`);
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