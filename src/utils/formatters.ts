/**
 * Format a number as a currency string with appropriate suffix (B, M, K)
 * @param value The numeric value to format
 * @returns Formatted currency string with suffix
 */
export const formatCurrency = (value: number): string => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };
  
  /**
   * Format a percentage value to integer
   * @param value The percentage value
   * @returns Rounded integer value
   */
  export const formatPercentage = (value: number): number => {
    return Math.round(value);
  };
  
  /**
   * Format a price value for display
   * @param price The price value
   * @returns Formatted price string
   */
  export const formatPrice = (price: number): string => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };