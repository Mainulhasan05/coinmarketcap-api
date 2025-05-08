import axios from 'axios';
import { getAdditionalPercentChanges, createApiResponse } from '../../../utils/apiHelpers.js';
import { formatCurrency, formatPercentage, formatPrice } from '../../../utils/formatters.js';
import { ApiError } from '../../../middleware/errorHandler.js';
import envConfig from '../../../config/envConfig.js';
const { cmcApiKey } = envConfig;
/**
 * Transform CoinMarketCap API data into our standard cryptocurrency format
 * @param cryptoData Raw cryptocurrency data from CoinMarketCap API
 * @param percentChangeData Additional percentage change data
 * @returns Transformed cryptocurrency data
 */
const transformCryptoData = (cryptoData, percentChangeData) => {
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
            id: index + 1,
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
        };
    });
};
/**
 * Fetch cryptocurrency data from CoinMarketCap API
 * @returns Promise with transformed cryptocurrency data
 */
export const getCryptoData = async () => {
    try {
        // First, get basic data from listings/latest endpoint
        const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
            headers: {
                'X-CMC_PRO_API_KEY': cmcApiKey,
            },
            params: {
                start: '1',
                limit: '20', // Getting more coins to match the requirement
                convert: 'USD',
                sort: 'market_cap',
                sort_dir: 'desc',
            },
        });
        // Extract symbols for additional data request
        const symbols = response.data.data.map((crypto) => crypto.symbol);
        // Get additional percent change data asynchronously
        const percentChangeData = await getAdditionalPercentChanges(symbols);
        // Transform the data to our standard format
        return transformCryptoData(response.data.data, percentChangeData);
    }
    catch (error) {
        console.error('Error fetching cryptocurrency data:', error.message);
        if (error.response) {
            console.error('Error details:', error.response.data);
        }
        throw new ApiError('Failed to fetch cryptocurrency data from CoinMarketCap API', 500, 'EXTERNAL_API_ERROR');
    }
};
/**
 * Get all cryptocurrencies controller
 */
export const getAllCryptocurrencies = async (req, res, next) => {
    try {
        const data = await getCryptoData();
        res.json(createApiResponse(data));
    }
    catch (error) {
        next(error);
    }
};
/**
 * Get a specific cryptocurrency by symbol controller
 */
export const getCryptocurrencyBySymbol = async (req, res, next) => {
    try {
        const symbol = req.params.symbol.toUpperCase();
        const data = await getCryptoData();
        const crypto = data.find((item) => item.symbol === symbol);
        if (!crypto) {
            throw ApiError.notFound(`Cryptocurrency with symbol ${symbol} not found`);
        }
        res.json(createApiResponse(crypto));
    }
    catch (error) {
        next(error);
    }
};
