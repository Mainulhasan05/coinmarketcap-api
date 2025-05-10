import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { CMCListingResponse, CryptoCurrency, CMCCryptoData, PaginatedApiResponse } from '../../../types/index.js';
import { getAdditionalPercentChanges, createApiResponse } from '../../../utils/apiHelpers.js';
import { formatCurrency, formatPercentage, formatPrice } from '../../../utils/formatters.js';
import { ApiError } from '../../../middleware/errorHandler.js';
import envConfig from '../../../config/envConfig.js';

const { cmcApiKey } = envConfig;

/**
 * Pagination options interface
 */
interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Transform CoinMarketCap API data into our standard cryptocurrency format
 * @param cryptoData Raw cryptocurrency data from CoinMarketCap API
 * @param percentChangeData Additional percentage change data
 * @param startIndex The starting index for the data
 * @returns Transformed cryptocurrency data
 */
const transformCryptoData = (
  cryptoData: CMCCryptoData[],
  percentChangeData: Record<string, any>,
  startIndex: number = 0
): CryptoCurrency[] => {
  return cryptoData.map((crypto, index) => {
    const quote = crypto.quote.USD;
    const symbol = crypto.symbol;
    const changes = percentChangeData[symbol] || {
      percentChange5m: 0,
      percentChange1h: quote.percent_change_1h || 0,
      percentChange6h: quote.percent_change_24h / 4 || 0, // approximate if not available
      percentChange24h: quote.percent_change_24h || 0,
    };

    return {
      id: crypto.id,
      name: crypto.name,
      symbol: symbol,
      logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${crypto.id}.png`,
      price: quote.price,
      formatted_price: formatPrice(quote.price),
      market_cap: quote.market_cap,
      formatted_market_cap: formatCurrency(quote.market_cap),
      volume_24h: quote.volume_24h,
      formatted_volume_24h: formatCurrency(quote.volume_24h),
      circulating_supply: crypto.circulating_supply,
      formatted_supply: formatCurrency(crypto.circulating_supply),
      max_supply: crypto.max_supply,
      percent_change: {
        '5m': formatPercentage(changes.percentChange5m),
        '1h': formatPercentage(changes.percentChange1h),
        '6h': formatPercentage(changes.percentChange6h),
        '24h': formatPercentage(changes.percentChange24h),
      },
      raw_percent_change: {
        '5m': changes.percentChange5m,
        '1h': changes.percentChange1h,
        '6h': changes.percentChange6h,
        '24h': changes.percentChange24h,
      },
      index: startIndex + index,
    };
  });
};

/**
 * Fetch cryptocurrency data from CoinMarketCap API with pagination
 * @param options Pagination options
 * @returns Promise with transformed cryptocurrency data and pagination information
 */
export const getCryptoData = async (options: PaginationOptions = {}): Promise<{
  data: CryptoCurrency[];
  pagination: {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}> => {
  try {
    // Default values
    const page = options.page || 1;
    const limit = options.limit || 10;
    const start = (page - 1) * limit + 1;
    
    // First, get data from listings/latest endpoint with pagination
    const response = await axios.get<CMCListingResponse>(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
      {
        headers: {
          'X-CMC_PRO_API_KEY': cmcApiKey,
        },
        params: {
          start: start.toString(),
          limit: limit.toString(),
          convert: 'USD',
          sort: 'market_cap',
          sort_dir: 'desc',
        },
      }
    );

    // Extract symbols for additional data request
    const symbols = response.data.data.map((crypto: CMCCryptoData) => crypto.symbol);

    // Get additional percent change data asynchronously
    const percentChangeData = await getAdditionalPercentChanges(symbols);

    // Transform the data to our standard format, passing the start index
    const transformedData = transformCryptoData(
      response.data.data, 
      percentChangeData,
      start - 1 // Start index (0-based)
    );
    
    // Calculate pagination metadata
    const totalItems = response.data.status.total_count;
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      data: transformedData,
      pagination: {
        total_items: totalItems,
        total_pages: totalPages,
        current_page: page,
        page_size: limit,
        has_next_page: page < totalPages,
        has_previous_page: page > 1
      }
    };
  } catch (error: any) {
    console.error('Error fetching cryptocurrency data:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
    throw new ApiError(
      'Failed to fetch cryptocurrency data from CoinMarketCap API',
      500,
      'EXTERNAL_API_ERROR'
    );
  }
};

/**
 * Get all cryptocurrencies without pagination (for backward compatibility)
 * @returns Promise with transformed cryptocurrency data
 */
export const getLegacyCryptoData = async (): Promise<CryptoCurrency[]> => {
  const result = await getCryptoData({ limit: 5 }); // Keep original limit of 5
  return result.data;
};

/**
 * Get all cryptocurrencies controller with pagination support
 */
export const getAllCryptocurrencies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if pagination is requested
    if (req.query.page || req.query.limit) {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // Validate pagination parameters
      if (isNaN(page) || page < 1) {
        throw new ApiError('Page number must be a positive integer', 400, 'INVALID_REQUEST');
      }
      
      if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new ApiError('Limit must be between 1 and 100', 400, 'INVALID_REQUEST');
      }
      
      const result = await getCryptoData({ page, limit });
      
      // Create paginated response
      const paginatedResponse: PaginatedApiResponse<CryptoCurrency> = {
        status: {
          timestamp: new Date(),
          error_code: 0,
          error_message: null,
        },
        data: result.data,
        pagination: result.pagination,
        filter: null,
        sort: {
          by: 'market_cap',
          period: '24h',
          direction: 'desc',
        },
        search: null,
      };
      
      res.json(paginatedResponse);
    } else {
      // Original behavior without pagination for backward compatibility
      const data = await getLegacyCryptoData();
      res.json(createApiResponse(data));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific cryptocurrency by symbol controller
 */
export const getCryptocurrencyBySymbol = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await getLegacyCryptoData();
    const crypto = data.find((item) => item.symbol === symbol);

    if (!crypto) {
      throw ApiError.notFound(`Cryptocurrency with symbol ${symbol} not found`);
    }

    res.json(createApiResponse(crypto));
  } catch (error) {
    next(error);
  }
};

/**
 * Get trending cryptocurrencies (highest percent change in 24h)
 */
export const getTrendingCryptocurrencies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Get data with pagination
    const result = await getCryptoData({ page, limit });
    
    // Sort by 24h percent change (descending)
    const sortedData = [...result.data].sort((a, b) => 
      b.raw_percent_change['24h'] - a.raw_percent_change['24h']
    );
    
    // Create paginated response
    const paginatedResponse: PaginatedApiResponse<CryptoCurrency> = {
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      data: sortedData,
      pagination: result.pagination,
      filter: 'trending',
      sort: {
        by: 'percent_change',
        period: '24h',
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
 * Get gainer cryptocurrencies (positive percent change in 24h)
 */
export const getGainerCryptocurrencies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Get data with pagination
    const result = await getCryptoData({ page, limit });
    
    // Filter by positive 24h percent change and sort (descending)
    const gainers = result.data
      .filter(crypto => crypto.raw_percent_change['24h'] > 0)
      .sort((a, b) => b.raw_percent_change['24h'] - a.raw_percent_change['24h']);
    
    // Create paginated response
    const paginatedResponse: PaginatedApiResponse<CryptoCurrency> = {
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      data: gainers,
      pagination: {
        ...result.pagination,
        total_items: gainers.length,
        total_pages: Math.ceil(gainers.length / limit),
      },
      filter: 'gainers',
      sort: {
        by: 'percent_change',
        period: '24h',
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
 * Get cryptocurrencies sorted by percent change for a specific time period
 */
export const getCryptocurrenciesByTimePeriod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const period = req.params.period as '5m' | '1h' | '6h' | '24h';
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Validate period
    if (!['5m', '1h', '6h', '24h'].includes(period)) {
      throw new ApiError('Invalid time period. Must be one of: 5m, 1h, 6h, 24h', 400, 'INVALID_REQUEST');
    }
    
    // Get data with pagination
    const result = await getCryptoData({ page, limit });
    
    // Sort by specified percent change (descending)
    const sortedData = [...result.data].sort((a, b) => 
      b.raw_percent_change[period] - a.raw_percent_change[period]
    );
    
    // Create paginated response
    const paginatedResponse: PaginatedApiResponse<CryptoCurrency> = {
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      data: sortedData,
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