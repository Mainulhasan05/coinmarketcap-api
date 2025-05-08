import express from 'express';
import { getTrending, getGainers, getByTimePeriod, getMasterData } from '../controller/dashboardController.js';
const router = express.Router();
/**
 * @route GET /api/trending
 * @desc Get trending cryptocurrencies sorted by 24h percent change
 * @access Public
 */
router.get('/trending', getTrending);
/**
 * @route GET /api/gainers
 * @desc Get cryptocurrencies with positive 24h percent change
 * @access Public
 */
router.get('/gainers', getGainers);
/**
 * @route GET /api/time-period/:period
 * @desc Get cryptocurrencies sorted by specified time period
 * @access Public
 */
router.get('/time-period/:period', getByTimePeriod);
/**
 * @route GET /api/master
 * @desc Master API with pagination, filtering and sorting
 * @access Public
 */
router.get('/master', getMasterData);
export default router;
