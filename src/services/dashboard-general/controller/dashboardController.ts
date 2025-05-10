import { Request, Response, NextFunction } from 'express';
import { FilterOptions, CryptoCurrency, PaginatedApiResponse } from '../../../types/index.js';
import { getCryptoData } from '../../cryptocurrencies/controller/cryptocurrenciesController.js';
import { ApiError } from '../../../middleware/errorHandler.js';

// Define all supported time periods
type TimePeriod = '5m' | '1h' | '6h' | '24h' | '7d' | '30d';

// Valid time periods for validation
const VALID_TIME_PERIODS: TimePeriod[] = ['5m', '1h', '6h', '24h', '7d', '30d'];

// Valid filter options for validation
const VALID_FILTERS = ['trending', 'gainers', ...VALID_TIME_PERIODS];

// Valid sort fields for validation
const VALID_SORT_FIELDS = ['market_cap', 'price', 'volume_24h', 'percent_change'];

/**
 * Get trending cryptocurrencies with customizable time period
 */
export const getTrending = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const period = (req.query.period as TimePeriod) || '24h'; // Default to 24h
    
    // Validate time period
    if (!VALID_TIME_PERIODS.includes(period as TimePeriod)) {
      throw ApiError.badRequest(`Invalid time period. Use one of: ${VALID_TIME_PERIODS.join(', ')}`);
    }
    
    // Get data directly from API with all parameters
    const result = await getCryptoData({ 
      page, 
      limit,
      period,
      filter: 'trending',
      sortBy: 'percent_change',
      sortDirection: 'desc'
    });

    // Create paginated response
    const paginatedResponse: PaginatedApiResponse<CryptoCurrency> = {
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      data: result.data,
      pagination: result.pagination,
      filter: 'trending',
      sort: {
        by: 'percent_change',
        period: period,
        direction: 'desc',
      },
      search: null,
    };

    res.json(paginatedResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Get gainers (cryptocurrencies with positive percent change) with customizable time period
 */
export const getGainers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const period = (req.query.period as TimePeriod) || '24h'; // Default to 24h
    
    // Validate time period
    if (!VALID_TIME_PERIODS.includes(period as TimePeriod)) {
      throw ApiError.badRequest(`Invalid time period. Use one of: ${VALID_TIME_PERIODS.join(', ')}`);
    }
    
    // Get data directly from API with all parameters
    const result = await getCryptoData({ 
      page, 
      limit,
      period,
      filter: 'gainers',
      sortBy: 'percent_change',
      sortDirection: 'desc'
    });

    // Create paginated response
    const paginatedResponse: PaginatedApiResponse<CryptoCurrency> = {
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      data: result.data,
      pagination: result.pagination,
      filter: 'gainers',
      sort: {
        by: 'percent_change',
        period: period,
        direction: 'desc',
      },
      search: null,
    };

    res.json(paginatedResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Get cryptocurrencies filtered by time period
 */
export const getByTimePeriod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const period = req.params.period as TimePeriod;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Validate time period
    if (!VALID_TIME_PERIODS.includes(period)) {
      throw ApiError.badRequest(`Invalid time period. Use one of: ${VALID_TIME_PERIODS.join(', ')}`);
    }
    
    // Get data directly from API with all parameters
    const result = await getCryptoData({ 
      page, 
      limit,
      period,
      filter: period,
      sortBy: 'percent_change',
      sortDirection: 'desc'
    });

    // Create paginated response
    const paginatedResponse: PaginatedApiResponse<CryptoCurrency> = {
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      data: result.data,
      pagination: result.pagination,
      filter: period,
      sort: {
        by: 'percent_change',
        period: period,
        direction: 'desc',
      },
      search: null,
    };

    res.json(paginatedResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Master API endpoint with advanced filtering, sorting, and pagination
 */
export const getMasterData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filter = req.query.filter as string | undefined;
    const sortBy = req.query.sortBy as string || 'market_cap';
    const sortPeriod = req.query.sortPeriod as TimePeriod || '24h';
    const sortDirection = (req.query.sortDirection as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const search = (req.query.search as string)?.toLowerCase() || '';
    
    // Validate parameters
    if (sortPeriod && !VALID_TIME_PERIODS.includes(sortPeriod)) {
      throw ApiError.badRequest(`Invalid sort period. Use one of: ${VALID_TIME_PERIODS.join(', ')}`);
    }
    
    if (filter && !VALID_FILTERS.includes(filter)) {
      throw ApiError.badRequest(`Invalid filter. Use one of: ${VALID_FILTERS.join(', ')}`);
    }
    
    if (sortBy && !VALID_SORT_FIELDS.includes(sortBy)) {
      throw ApiError.badRequest(`Invalid sort field. Use one of: ${VALID_SORT_FIELDS.join(', ')}`);
    }
    
    // Pass all parameters directly to the API
    const result = await getCryptoData({ 
      page,
      limit,
      period: sortPeriod,
      filter,
      sortBy,
      sortDirection,
      search
    });

    // Create paginated response
    const paginatedResponse: PaginatedApiResponse<CryptoCurrency> = {
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      data: result.data,
      pagination: result.pagination,
      filter: filter || null,
      sort: {
        by: sortBy,
        period: sortPeriod,
        direction: sortDirection,
      },
      search: search || null,
    };

    res.json(paginatedResponse);
  } catch (error) {
    next(error);
  }
};