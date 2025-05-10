import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { CMCListingResponse, CryptoCurrency, CMCCryptoData, FilterOptions } from '../../../types/index.js';
import { getAdditionalPercentChanges } from '../../../utils/apiHelpers.js';
import { formatCurrency, formatPercentage, formatPrice } from '../../../utils/formatters.js';
import { ApiError } from '../../../middleware/errorHandler.js';
import envConfig from '../../../config/envConfig.js';

const { cmcApiKey } = envConfig;

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
      percentChange7d: quote.percent_change_7d || 0,
      percentChange30d: quote.percent_change_30d || 0,
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
        '7d': formatPercentage(changes.percentChange7d),
        '30d': formatPercentage(changes.percentChange30d),
      },
      raw_percent_change: {
        '5m': changes.percentChange5m,
        '1h': changes.percentChange1h,
        '6h': changes.percentChange6h,
        '24h': changes.percentChange24h,
        '7d': changes.percentChange7d,
        '30d': changes.percentChange30d,
      },
      index: startIndex + index,
    };
  });
};

/**
 * Build CoinMarketCap API parameters based on filter options
 * @param options Filter options
 * @returns API parameters for CoinMarketCap
 */
const buildApiParams = (options: FilterOptions = {}) => {
  // Default values
  const page = options.page || 1;
  const limit = options.limit || 10;
  const start = (page - 1) * limit + 1;
  
  // Base parameters that are always needed
  const params: Record<string, string> = {
    start: start.toString(),
    limit: limit.toString(),
    convert: 'USD',
  };
  
  // Apply sorting based on options
  if (options.sortBy) {
    switch (options.sortBy) {
      case 'market_cap':
        params.sort = 'market_cap';
        break;
      case 'price':
        params.sort = 'price';
        break;
      case 'volume_24h':
        params.sort = 'volume_24h';
        break;
      case 'percent_change':
        // Map to the appropriate CoinMarketCap percent_change field
        if (options.sortPeriod === '1h') {
          params.sort = 'percent_change_1h';
        } else if (options.sortPeriod === '24h') {
          params.sort = 'percent_change_24h';
        } else if (options.sortPeriod === '7d') {
          params.sort = 'percent_change_7d';
        } else if (options.sortPeriod === '30d') {
          params.sort = 'percent_change_30d';
        } else {
          // Default to 24h if the period isn't directly supported
          params.sort = 'percent_change_24h';
        }
        break;
      default:
        params.sort = 'market_cap';
    }
  } else {
    params.sort = 'market_cap';
  }
  
  // Apply sort direction
  if (options.sortDirection) {
    params.sort_dir = options.sortDirection;
  } else {
    params.sort_dir = 'desc';
  }
  
  // Apply specific filters
  if (options.filter) {
    if (options.filter === 'trending') {
      // For trending, sort by percent change (preferably for the specified period)
      if (options.sortPeriod === '1h') {
        params.sort = 'percent_change_1h';
      } else if (options.sortPeriod === '7d') {
        params.sort = 'percent_change_7d';
      } else if (options.sortPeriod === '30d') {
        params.sort = 'percent_change_30d';
      } else {
        params.sort = 'percent_change_24h';
      }
      params.sort_dir = 'desc';
    } else if (options.filter === 'gainers') {
      // For gainers, we'll still need to filter positive percent changes after getting data
      // But we can at least sort by the right field
      if (options.sortPeriod === '1h') {
        params.sort = 'percent_change_1h';
      } else if (options.sortPeriod === '7d') {
        params.sort = 'percent_change_7d';
      } else if (options.sortPeriod === '30d') {
        params.sort = 'percent_change_30d';
      } else {
        params.sort = 'percent_change_24h';
      }
      params.sort_dir = 'desc';
    } else if (['5m', '1h', '6h', '24h', '7d', '30d'].includes(options.filter)) {
      // Time period filters - map to appropriate CoinMarketCap field
      if (options.filter === '1h') {
        params.sort = 'percent_change_1h';
      } else if (options.filter === '7d') {
        params.sort = 'percent_change_7d';
      } else if (options.filter === '30d') {
        params.sort = 'percent_change_30d';
      } else {
        // For 5m and 6h which aren't directly supported, default to closest available
        params.sort = 'percent_change_24h';
      }
      params.sort_dir = options.sortDirection || 'desc';
    }
  }
  
  return params;
};

/**
 * Fetch cryptocurrency data from CoinMarketCap API with full filtering capabilities
 * @param options Filter options
 * @returns Promise with transformed cryptocurrency data and pagination metadata
 */
export const getCryptoData = async (options: FilterOptions = {}): Promise<{
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
    // Default values for pagination
    const page = options.page || 1;
    const limit = options.limit || 10;
    
    // Build API parameters based on options
    const params = buildApiParams(options);
    
    // Fetch data from CoinMarketCap API
    const response = await axios.get<CMCListingResponse>(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
      {
        headers: {
          'X-CMC_PRO_API_KEY': cmcApiKey,
        },
        params,
      }
    );

    // Extract symbols for additional data request
    const symbols = response.data.data.map((crypto: CMCCryptoData) => crypto.symbol);

    // Get additional percent change data asynchronously
    const percentChangeData = await getAdditionalPercentChanges(symbols);

    // Calculate start index for proper indexing
    const start = (page - 1) * limit + 1;
    
    // Transform the data to our standard format
    let transformedData = transformCryptoData(
      response.data.data,
      percentChangeData,
      start - 1 // Start index (0-based)
    );
    
    // Apply additional filtering for gainers since CoinMarketCap API doesn't support this directly
    if (options.filter === 'gainers') {
      // Determine which percent change field to use
      let periodField = '24h';
      if (options.sortPeriod === '1h') periodField = '1h';
      else if (options.sortPeriod === '6h') periodField = '6h';
      else if (options.sortPeriod === '5m') periodField = '5m';
      else if (options.sortPeriod === '7d') periodField = '7d';
      else if (options.sortPeriod === '30d') periodField = '30d';
      
      transformedData = transformedData.filter(
        crypto => crypto.raw_percent_change[periodField as keyof typeof crypto.raw_percent_change] > 0
      );
    }
    
    // Apply search filter if provided
    if (options.search && options.search.trim()) {
      const searchTerm = options.search.toLowerCase().trim();
      transformedData = transformedData.filter(
        crypto => 
          crypto.name.toLowerCase().includes(searchTerm) || 
          crypto.symbol.toLowerCase().includes(searchTerm)
      );
    }
    
    // Calculate pagination metadata
    const totalItems = response.data.status.total_count;
    // For filtered results (gainers, search), modify total items
    const actualTotalItems = (options.filter === 'gainers' || options.search) 
      ? transformedData.length 
      : totalItems;
    
    const totalPages = Math.ceil(actualTotalItems / limit);
    
    return {
      data: transformedData,
      pagination: {
        total_items: actualTotalItems,
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
 * Get all cryptocurrencies controller with pagination support
 */
export const getAllCryptocurrencies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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
    
    res.json({
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      data: result.data,
      pagination: result.pagination
    });
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
    
    // We'll request a larger limit to increase chances of finding the symbol
    // in a single API call
    const result = await getCryptoData({ limit: 100 });
    const crypto = result.data.find((item) => item.symbol === symbol);

    if (!crypto) {
      throw ApiError.notFound(`Cryptocurrency with symbol ${symbol} not found`);
    }

    res.json({
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      data: crypto
    });
  } catch (error) {
    next(error);
  }
};