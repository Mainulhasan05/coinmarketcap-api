// services/cryptocurrencies/controller/cryptocurrenciesController.ts
import { Request, Response } from 'express';
import { 
  getCryptocurrencyListings, 
  getTrendingCryptocurrencies,
  getGainersLosers,
  getCryptocurrencyByTimePeriod,
  getMasterCryptocurrencyData
} from '../api/coinMarketCapApi.js';
import { 
  CryptocurrencyListingsParams, 
  MasterQueryParams,
  TrendingParams,
  GainersLosersParams
} from '../../../types/cryptocurrency.js';

/**
 * Get all cryptocurrencies with optional filters
 */
export const getAllCryptocurrencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const params: CryptocurrencyListingsParams = {
      start: req.query.start ? parseInt(req.query.start as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      sort: req.query.sort as string || 'market_cap',
      sort_dir: (req.query.sort_dir as 'asc' | 'desc') || 'desc',
      convert: req.query.convert as string || 'USD'
    };

    // Add optional filters if provided
    if (req.query.price_min) params.price_min = parseFloat(req.query.price_min as string);
    if (req.query.price_max) params.price_max = parseFloat(req.query.price_max as string);
    if (req.query.market_cap_min) params.market_cap_min = parseFloat(req.query.market_cap_min as string);
    if (req.query.market_cap_max) params.market_cap_max = parseFloat(req.query.market_cap_max as string);
    if (req.query.volume_24h_min) params.volume_24h_min = parseFloat(req.query.volume_24h_min as string);
    if (req.query.volume_24h_max) params.volume_24h_max = parseFloat(req.query.volume_24h_max as string);
    if (req.query.percent_change_24h_min) params.percent_change_24h_min = parseFloat(req.query.percent_change_24h_min as string);
    if (req.query.percent_change_24h_max) params.percent_change_24h_max = parseFloat(req.query.percent_change_24h_max as string);
    if (req.query.cryptocurrency_type) params.cryptocurrency_type = req.query.cryptocurrency_type as string;
    if (req.query.tag) params.tag = req.query.tag as string;
    
    const data = await getCryptocurrencyListings(params);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in getAllCryptocurrencies controller:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cryptocurrency data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get trending cryptocurrencies
 */
export const getTrending = async (req: Request, res: Response): Promise<void> => {
  try {
    const params: TrendingParams = {};
    
    if (req.query.limit) params.limit = parseInt(req.query.limit as string);
    if (req.query.convert) params.convert = req.query.convert as string;
    if (req.query.time_period) params.time_period = req.query.time_period as string;
    
    const data = await getTrendingCryptocurrencies(params);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in getTrending controller:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trending cryptocurrency data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get gainers and losers
 */
export const getGainers = async (req: Request, res: Response): Promise<void> => {
  try {
    const params: GainersLosersParams = {};
    
    if (req.query.limit) params.limit = parseInt(req.query.limit as string);
    if (req.query.convert) params.convert = req.query.convert as string;
    if (req.query.time_period) params.time_period = req.query.time_period as string;
    
    const data = await getGainersLosers(params);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in getGainers controller:', error);
    res.status(500).json({ 
      error: 'Failed to fetch gainers/losers data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get cryptocurrency data for a specific time period
 */
export const getByTimePeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const timePeriod = req.params.period as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    const data = await getCryptocurrencyByTimePeriod(timePeriod, limit);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in getByTimePeriod controller:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cryptocurrency data by time period',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Master endpoint for comprehensive cryptocurrency data
 */
export const getMasterData = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryParams: MasterQueryParams = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      filter: req.query.filter as 'all' | 'gainers' | 'losers' | 'trending' || 'all',
      sortBy: req.query.sortBy as 'market_cap' | 'price' | 'volume_24h' | 'percent_change' || 'market_cap',
      sortPeriod: req.query.sortPeriod as '1h' | '24h' | '7d' | '30d' || '24h',
      sortDirection: req.query.sortDirection as 'asc' | 'desc' || 'desc',
      search: req.query.search as string || '',
      convert: req.query.convert as string || 'USD'
    };
    
    const data = await getMasterCryptocurrencyData(
      queryParams.page,
      queryParams.limit,
      queryParams.filter,
      queryParams.sortBy,
      queryParams.sortPeriod,
      queryParams.sortDirection,
      queryParams.search,
      queryParams.convert
    );
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in getMasterData controller:', error);
    res.status(500).json({ 
      error: 'Failed to fetch master cryptocurrency data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};