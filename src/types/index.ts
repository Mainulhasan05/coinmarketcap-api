export interface PercentChange {
    '5m': number;
    '1h': number;
    '6h': number;
    '24h': number;
  }
  
  export interface CryptoCurrency {
    id: number;
    name: string;
    symbol: string;
    logo: string;
    price: number;
    formatted_price: string;
    market_cap: number;
    formatted_market_cap: string;
    volume_24h: number;
    formatted_volume_24h: string;
    circulating_supply: number;
    formatted_supply: string;
    max_supply: number | null;
    percent_change: PercentChange;
    raw_percent_change: PercentChange;
    index?: number;
  }
  
  export interface ApiResponse<T> {
    status: {
      timestamp: Date;
      error_code: number;
      error_message: string | null;
    };
    data: T | null;
  }
  
  export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
    pagination: {
      total_items: number;
      total_pages: number;
      current_page: number;
      page_size: number;
      has_next_page: boolean;
      has_previous_page: boolean;
    };
    filter: string | null;
    sort: {
      by: string;
      period: string;
      direction: string;
    };
    search: string | null;
  }
  
  export interface FilterOptions {
    page?: number;
    limit?: number;
    filter?: string;
    sortBy?: string;
    sortPeriod?: '5m' | '1h' | '6h' | '24h';
    sortDirection?: 'asc' | 'desc';
    search?: string;
  }
  
  export interface CMCListingResponse {
    data: CMCCryptoData[];
    status: {
      timestamp: string;
      error_code: number;
      error_message: string | null;
      elapsed: number;
      credit_count: number;
      notice: string | null;
    };
  }
  
  export interface CMCCryptoData {
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
    platform: any;
    cmc_rank: number;
    self_reported_circulating_supply: number | null;
    self_reported_market_cap: number | null;
    tvl_ratio: number | null;
    last_updated: string;
    quote: {
      USD: {
        price: number;
        volume_24h: number;
        volume_change_24h: number;
        percent_change_1h: number;
        percent_change_24h: number;
        percent_change_7d: number;
        percent_change_30d: number;
        percent_change_60d: number;
        percent_change_90d: number;
        market_cap: number;
        market_cap_dominance: number;
        fully_diluted_market_cap: number;
        tvl: number | null;
        last_updated: string;
      };
    };
  }
  
  export interface CMCQuoteResponse {
    data: {
      [key: string]: {
        id: number;
        name: string;
        symbol: string;
        slug: string;
        quote: {
          USD: {
            price: number;
            volume_24h: number;
            percent_change_1h: number;
            percent_change_24h: number;
            percent_change_7d: number;
            market_cap: number;
            last_updated: string;
          };
        };
      };
    };
    status: {
      timestamp: string;
      error_code: number;
      error_message: string | null;
    };
  }
  
  export interface PercentChanges {
    [symbol: string]: {
      percentChange5m: number;
      percentChange1h: number;
      percentChange6h: number;
      percentChange24h: number;
    };
  }