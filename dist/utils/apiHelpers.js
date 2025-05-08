import axios from 'axios';
import envConfig from '../config/envConfig.js';
const { cmcApiKey } = envConfig;
/**
 * Get additional percentage change data for the specified cryptocurrency symbols
 * @param symbols Array of cryptocurrency symbols
 * @returns Object with additional percentage change data
 */
export async function getAdditionalPercentChanges(symbols) {
    try {
        // For 5m and 6h changes, we use approximations based on the available data
        try {
            const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
                headers: {
                    'X-CMC_PRO_API_KEY': cmcApiKey,
                },
                params: {
                    symbol: symbols.join(','),
                    convert: 'USD',
                },
            });
            const result = {};
            // Process the response
            if (response.data && response.data.data) {
                Object.keys(response.data.data).forEach((symbol) => {
                    const crypto = response.data.data[symbol];
                    const quote = crypto.quote.USD;
                    // For 5m, we'll estimate based on current price movements
                    const percentChange5m = quote.percent_change_1h / 12; // rough approximation
                    result[symbol] = {
                        percentChange5m: percentChange5m,
                        percentChange1h: quote.percent_change_1h,
                        percentChange6h: quote.percent_change_24h / 4, // approximation for 6h
                        percentChange24h: quote.percent_change_24h,
                    };
                });
            }
            return result;
        }
        catch (error) {
            console.error('Error fetching additional percentage changes:', error instanceof Error ? error.message : 'Unknown error');
            return {};
        }
    }
    catch (error) {
        console.error('Error in getAdditionalPercentChanges:', error instanceof Error ? error.message : 'Unknown error');
        return {};
    }
}
/**
 * Create a standard API response object
 * @param data The data to include in the response
 * @param errorCode The error code (0 for success)
 * @param errorMessage The error message (null for success)
 * @returns Standardized API response object
 */
export function createApiResponse(data, errorCode = 0, errorMessage = null) {
    return {
        status: {
            timestamp: new Date(),
            error_code: errorCode,
            error_message: errorMessage,
        },
        data,
    };
}
