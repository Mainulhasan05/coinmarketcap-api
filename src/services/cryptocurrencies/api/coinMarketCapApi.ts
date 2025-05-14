// services/cryptocurrencies/api/coinMarketCapApi.ts
import axios from 'axios';
import envConfig from '../../../config/envConfig.js';
import { 
  CryptocurrencyListingsParams, 
  CryptocurrencyListingsResponse,
  TrendingResponse,
  GainersLosersData,
  TrendingParams,
  GainersLosersParams
} from '../../../types/cryptocurrency.js';

// Base configuration for Axios
const api = axios.create({
  baseURL: 'https://pro-api.coinmarketcap.com/v1',
  headers: {
    'X-CMC_PRO_API_KEY': envConfig.coinMarketCap.apiKey,
    'Accept': 'application/json'
  }
});

/**
 * Get latest cryptocurrency listings with various filters
 */
export const getCryptocurrencyListings = async (params: CryptocurrencyListingsParams = {}): Promise<CryptocurrencyListingsResponse> => {
  try {
    const response = await api.get('/cryptocurrency/listings/latest', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching cryptocurrency listings:', error);
    throw error;
  }
};

/**
 * Get trending cryptocurrencies
 * @param params - Parameters for the trending API
 */
export const getTrendingCryptocurrencies = async (
  params: TrendingParams = {}
): Promise<TrendingResponse> => {
  try {
    // Set default values if not provided
    const apiParams = {
      limit: params.limit || 10,
      convert: params.convert || 'USD',
      time_period: params.time_period || '24h',
      ...params
    };
    
    const response = await api.get('/cryptocurrency/trending/latest', {
      params: apiParams
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching trending cryptocurrencies:', error);
    throw error;
  }
};

/**
 * Get gainers and losers
 * @param params - Parameters for the gainers/losers API
 */
export const getGainersLosers = async (
  params: GainersLosersParams = {}
): Promise<GainersLosersData> => {
  try {
    // Set default values if not provided
    const apiParams = {
      limit: params.limit || 10,
      convert: params.convert || 'USD',
      time_period: params.time_period || '24h',
      ...params
    };
    
    const response = await api.get('/cryptocurrency/trending/gainers-losers', {
      params: apiParams
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching gainers and losers:', error);
    throw error;
  }
};

/**
 * Get cryptocurrency data for a specific time period
 */
export const getCryptocurrencyByTimePeriod = async (timePeriod: string, limit: number = 100): Promise<CryptocurrencyListingsResponse> => {
  // Valid time periods are: 5m, 1h, 6h, 24h
  const validPeriods = ['5m', '1h', '6h', '24h'];
  if (!validPeriods.includes(timePeriod)) {
    throw new Error(`Invalid time period: ${timePeriod}. Valid periods are: ${validPeriods.join(', ')}`);
  }

  try {
    // For time periods, we'll use sort by percent change for that period
    const sortParam = `percent_change_${timePeriod}`;
    
    return await getCryptocurrencyListings({
      limit,
      sort: sortParam,
      sort_dir: 'desc'
    });
  } catch (error) {
    console.error(`Error fetching cryptocurrency data for time period ${timePeriod}:`, error);
    throw error;
  }
};

/**
 * Master function to get cryptocurrency data with comprehensive filtering and sorting
 */
export const getMasterCryptocurrencyData = async (
  page: number = 1, 
  limit: number = 100,
  filter: string = 'all',
  sortBy: string = 'market_cap',
  sortPeriod: string = '24h',
  sortDirection: string = 'desc',
  search: string = '',
  convert: string = 'USD'
) => {
  try {
    let result;
    
    // Handle the filter parameter
    switch (filter) {
      case 'trending':
        // For trending, pass parameters as an object
        result = await getTrendingCryptocurrencies({
          limit,
          convert,
          time_period: sortPeriod
        });
        return { data: result.data, status: result.status };
        
      case 'gainers':
        result = await getGainersLosers({
          limit,
          convert,
          time_period: sortPeriod
        });
        return { data: result.data.gainers, status: result.status };
        
      case 'losers':
        result = await getGainersLosers({
          limit,
          convert,
          time_period: sortPeriod
        });
        return { data: result.data.losers, status: result.status };
        
      case 'all':
      default:
        // For regular listings with sorting and filtering
        const start = (page - 1) * limit + 1;
        let sort = sortBy;
        
        // If sorting by percent change, include the period
        if (sortBy === 'percent_change' && ['1h', '24h', '7d', '30d'].includes(sortPeriod)) {
          sort = `percent_change_${sortPeriod}`;
        }
        
        // Add convert parameter to the regular listings
        const params: CryptocurrencyListingsParams = {
          start,
          limit,
          sort,
          sort_dir: sortDirection as 'asc' | 'desc',
          convert
        };
        
        result = await getCryptocurrencyListings(params);
        
        // If search parameter is provided, filter the results
        if (search) {
          const searchLower = search.toLowerCase();
          result.data = result.data.filter(crypto => 
            crypto.name.toLowerCase().includes(searchLower) || 
            crypto.symbol.toLowerCase().includes(searchLower)
          );
        }
        
        return { data: result.data, status: result.status };
    }
  } catch (error) {
    console.error('Error in master cryptocurrency data function:', error);
    throw error;
  }
};