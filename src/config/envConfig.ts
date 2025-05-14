// config/envConfig.ts
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const envConfig = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  coinMarketCap: {
    apiKey: process.env.COINMARKETCAP_API_KEY || '',
    baseUrl: 'https://pro-api.coinmarketcap.com/v1'
  }
};

export default envConfig;