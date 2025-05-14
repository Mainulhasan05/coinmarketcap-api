// services/cryptocurrencies/route/cryptocurrenciesRoutes.ts
import express from 'express';
import { 
  getAllCryptocurrencies, 
  getTrending, 
  getGainers,
  getByTimePeriod,
  getMasterData
} from '../controller/cryptocurrenciesController.js';

const router = express.Router();

/**
 * @route GET /api/cryptocurrencies
 * @desc Get all cryptocurrency data with optional filters
 * @access Public
 */
router.get('/', getAllCryptocurrencies);

/**
 * @route GET /api/cryptocurrencies/trending
 * @desc Get trending cryptocurrencies
 * @access Public
 */
router.get('/trending', getTrending);

/**
 * @route GET /api/cryptocurrencies/gainers
 * @desc Get gainers and losers
 * @access Public
 */
router.get('/gainers', getGainers);

/**
 * @route GET /api/cryptocurrencies/time-period/:period
 * @desc Get cryptocurrency data for a specific time period (5m, 1h, 6h, 24h)
 * @access Public
 */
router.get('/time-period/:period', getByTimePeriod);

/**
 * @route GET /api/cryptocurrencies/master
 * @desc Master endpoint for comprehensive cryptocurrency data with all filters
 * @access Public
 */
router.get('/master', getMasterData);

export default router;