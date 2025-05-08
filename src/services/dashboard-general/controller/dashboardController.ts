import { Request, Response, NextFunction } from 'express';
import { FilterOptions, CryptoCurrency } from '../../../types/index.js';
import { getCryptoData } from '../../cryptocurrencies/controller/cryptocurrenciesController.js';
import { ApiError } from '../../../middleware/errorHandler.js';

/**
 * Get trending cryptocurrencies (sorted by 24h percent change)
 */
export const getTrending = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getCryptoData();
    
    // Sort by 24h percent change in descending order
    const sortedData = [...data].sort(
      (a, b) => b.raw_percent_change['24h'] - a.raw_percent_change['24h']
    );

    res.json({
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      filter: 'trending',
      data: sortedData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get gainers (cryptocurrencies with positive 24h percent change)
 */
export const getGainers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getCryptoData();
    
    // Filter by positive 24h percent change and sort in descending order
    const sortedData = [...data]
      .filter((crypto) => crypto.raw_percent_change['24h'] > 0)
      .sort((a, b) => b.raw_percent_change['24h'] - a.raw_percent_change['24h']);

    res.json({
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      filter: 'gainers',
      data: sortedData,
    });
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
    const period = req.params.period;
    
    // Validate time period
    if (!['5m', '1h', '6h', '24h'].includes(period)) {
      throw ApiError.badRequest('Invalid time period. Use 5m, 1h, 6h, or 24h.');
    }
    
    const data = await getCryptoData();
    
    // Sort by the specified time period in descending order
    const sortedData = [...data].sort(
      (a, b) => b.raw_percent_change[period as keyof typeof b.raw_percent_change] - 
                a.raw_percent_change[period as keyof typeof a.raw_percent_change]
    );

    res.json({
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      filter: period,
      data: sortedData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply filters to cryptocurrency data
 * @param data Cryptocurrency data
 * @param options Filter options
 * @returns Filtered cryptocurrency data
 */
const applyFilters = (data: CryptoCurrency[], options: FilterOptions): CryptoCurrency[] => {
  let filteredData = [...data];
  const {
    filter,
    sortBy = 'market_cap',
    sortPeriod = '24h',
    sortDirection = 'desc',
    search,
  } = options;

  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    filteredData = filteredData.filter(
      (crypto) =>
        crypto.name.toLowerCase().includes(searchLower) ||
        crypto.symbol.toLowerCase().includes(searchLower)
    );
  }

  // Apply specific filters
  if (filter) {
    switch (filter) {
      case 'trending':
        filteredData.sort(
          (a, b) => b.raw_percent_change['24h'] - a.raw_percent_change['24h']
        );
        break;
      case 'gainers':
        filteredData = filteredData
          .filter((crypto) => crypto.raw_percent_change['24h'] > 0)
          .sort(
            (a, b) => b.raw_percent_change['24h'] - a.raw_percent_change['24h']
          );
        break;
      case '5m':
      case '1h':
      case '6h':
      case '24h':
        // Sort by the specified time period
        filteredData.sort((a, b) =>
          sortDirection === 'asc'
            ? a.raw_percent_change[filter] - b.raw_percent_change[filter]
            : b.raw_percent_change[filter] - a.raw_percent_change[filter]
        );
        break;
    }
  } else {
    // Apply sorting if no specific filter is selected
    switch (sortBy) {
      case 'price':
        filteredData.sort((a, b) =>
          sortDirection === 'asc' ? a.price - b.price : b.price - a.price
        );
        break;
      case 'market_cap':
        filteredData.sort((a, b) =>
          sortDirection === 'asc'
            ? a.market_cap - b.market_cap
            : b.market_cap - a.market_cap
        );
        break;
      case 'volume_24h':
        filteredData.sort((a, b) =>
          sortDirection === 'asc'
            ? a.volume_24h - b.volume_24h
            : b.volume_24h - a.volume_24h
        );
        break;
      case 'percent_change':
        // Use the specified sort period
        if (['5m', '1h', '6h', '24h'].includes(sortPeriod)) {
          filteredData.sort((a, b) =>
            sortDirection === 'asc'
              ? a.raw_percent_change[sortPeriod as keyof typeof a.raw_percent_change] -
                b.raw_percent_change[sortPeriod as keyof typeof b.raw_percent_change]
              : b.raw_percent_change[sortPeriod as keyof typeof b.raw_percent_change] -
                a.raw_percent_change[sortPeriod as keyof typeof a.raw_percent_change]
          );
        }
        break;
      default:
        // Default sort by market cap
        filteredData.sort((a, b) => b.market_cap - a.market_cap);
    }
  }

  return filteredData;
};

/**
 * Master API endpoint with pagination, filtering and sorting
 */
export const getMasterData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get raw data first
    const allData = await getCryptoData();

    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filter = req.query.filter as string | undefined;
    const sortBy = req.query.sortBy as string || 'market_cap';
    const sortPeriod = req.query.sortPeriod as '5m' | '1h' | '6h' | '24h' || '24h';
    const sortDirection = (req.query.sortDirection as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const search = (req.query.search as string)?.toLowerCase() || '';

    // Apply filters and sorting
    const filteredData = applyFilters(allData, {
      filter,
      sortBy,
      sortPeriod,
      sortDirection,
      search,
    });

    // Calculate pagination
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Add indices for pagination
    paginatedData.forEach((item, index) => {
      item.index = startIndex + index + 1;
    });

    // Prepare pagination metadata
    const pagination = {
      total_items: totalItems,
      total_pages: totalPages,
      current_page: page,
      page_size: limit,
      has_next_page: page < totalPages,
      has_previous_page: page > 1,
    };

    // Send response
    res.json({
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      pagination,
      filter: filter || null,
      sort: {
        by: sortBy,
        period: sortPeriod,
        direction: sortDirection,
      },
      search: search || null,
      data: paginatedData,
    });
  } catch (error) {
    next(error);
  }
};