import express from 'express';
import { getAllCryptocurrencies, getCryptocurrencyBySymbol } from '../controller/cryptocurrenciesController.js';
const router = express.Router();
/**
 * @route GET /api/cryptocurrencies
 * @desc Get all cryptocurrency data
 * @access Public
 */
router.get('/', getAllCryptocurrencies);
/**
 * @route GET /api/cryptocurrencies/:symbol
 * @desc Get specific cryptocurrency by symbol
 * @access Public
 */
router.get('/:symbol', getCryptocurrencyBySymbol);
export default router;
