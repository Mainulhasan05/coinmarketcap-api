// types/cryptocurrency.ts
export interface Status {
  timestamp: string;
  error_code: number;
  error_message: string | null;
  elapsed: number;
  credit_count: number;
  notice: string | null;
}

export interface Quote {
  price: number;
  volume_24h: number;
  volume_change_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  percent_change_30d?: number;
  percent_change_60d?: number;
  percent_change_90d?: number;
  market_cap: number;
  market_cap_dominance: number;
  fully_diluted_market_cap: number;
  last_updated: string;
}

export interface Cryptocurrency {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  num_market_pairs: number;
  date_added: string;
  tags: string[];
  max_supply: number | null;
  circulating_supply: number;
  total_supply: number;
  platform: any | null;
  cmc_rank: number;
  self_reported_circulating_supply: number | null;
  self_reported_market_cap: number | null;
  tvl_ratio: number | null;
  last_updated: string;
  quote: {
    [currency: string]: Quote;
  };
}

export interface CryptocurrencyListingsResponse {
  status: Status;
  data: Cryptocurrency[];
}

export interface TrendingCryptocurrency {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  num_market_pairs: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  last_updated: string;
  date_added: string;
  tags: string[];
  quote: {
    [currency: string]: Quote;
  };
}

export interface TrendingResponse {
  status: Status;
  data: TrendingCryptocurrency[];
}

export interface GainersLosersData {
  data: {
    gainers: Cryptocurrency[];
    losers: Cryptocurrency[];
  };
  status: Status;
}

// Query parameters for the API requests
export interface CryptocurrencyListingsParams {
  start?: number;
  limit?: number;
  price_min?: number;
  price_max?: number;
  market_cap_min?: number;
  market_cap_max?: number;
  volume_24h_min?: number;
  volume_24h_max?: number;
  circulating_supply_min?: number;
  circulating_supply_max?: number;
  percent_change_24h_min?: number;
  percent_change_24h_max?: number;
  convert?: string;
  convert_id?: string;
  sort?: string;
  sort_dir?: 'asc' | 'desc';
  cryptocurrency_type?: string;
  tag?: string;
  aux?: string;
}

export interface TrendingParams {
  start?: number;
  limit?: number;
  convert?: string;
  convert_id?: string;
  time_period?: string;
}

export interface GainersLosersParams {
  start?: number;
  limit?: number;
  convert?: string;
  convert_id?: string;
  time_period?: string;
}

export interface TimePeriod {
  period: '5m' | '1h' | '6h' | '24h' | '7d' | '30d';
}

export interface MasterQueryParams {
  page?: number;
  limit?: number;
  start?: number;
  filter?: 'all' | 'gainers' | 'losers' | 'trending';
  sortBy?: 'market_cap' | 'price' | 'volume_24h' | 'percent_change';
  sortPeriod?: '1h' | '24h' | '7d' | '30d';
  sortDirection?: 'asc' | 'desc';
  search?: string;
  convert?: string;
}