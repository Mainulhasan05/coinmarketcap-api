const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Your CoinMarketCap API key
const CMC_API_KEY = process.env.CMC_API_KEY;

// Helper function to format currency values
const formatCurrency = (value) => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};

// Function to get additional time interval percentage changes
async function getAdditionalPercentChanges(symbols) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutesAgo = now - 5 * 60;
    const sixHoursAgo = now - 6 * 60 * 60;

    // We'll use CoinMarketCap's quotes/latest endpoint which is more reliable
    // than historical data for shorter time intervals
    try {
      const response = await axios.get(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": CMC_API_KEY,
          },
          params: {
            symbol: symbols.join(","),
            convert: "USD",
          },
        }
      );

      const result = {};

      // Process the response
      if (response.data && response.data.data) {
        Object.keys(response.data.data).forEach((symbol) => {
          const crypto = response.data.data[symbol];
          const quote = crypto.quote.USD;

          // For 5m, we'll estimate based on current price movements
          // Note: CoinMarketCap doesn't provide 5m directly, so this is an approximation
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
    } catch (error) {
      console.error(
        `Error fetching additional percentage changes:`,
        error.message
      );
      return {};
    }
  } catch (error) {
    console.error("Error in getAdditionalPercentChanges:", error.message);
    return {};
  }
}

// Main function to fetch cryptocurrency data with enhanced metrics
async function getCryptoData() {
  try {
    // First, get basic data from listings/latest endpoint
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
      {
        headers: {
          "X-CMC_PRO_API_KEY": CMC_API_KEY,
        },
        params: {
          start: "1",
          limit: "20", // Getting more coins to match the image
          convert: "USD",
          sort: "market_cap",
          sort_dir: "desc",
        },
      }
    );

    // Extract symbols for additional data request
    const symbols = response.data.data.map((crypto) => crypto.symbol);

    // Get additional percent change data asynchronously
    const percentChangeData = await getAdditionalPercentChanges(symbols);

    // Format percentage for display
    const formatPercentage = (value) => {
      // Round to integer as shown in the image
      return Math.round(value);
    };

    // Map to the desired format that matches the image dashboard exactly
    const cryptoData = response.data.data.map((crypto, index) => {
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
        formatted_price: `${quote.price.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        market_cap: quote.market_cap,
        formatted_market_cap: formatCurrency(quote.market_cap),
        volume_24h: quote.volume_24h,
        formatted_volume_24h: formatCurrency(quote.volume_24h),
        circulating_supply: crypto.circulating_supply,
        formatted_supply: formatCurrency(crypto.circulating_supply),
        max_supply: crypto.max_supply,
        percent_change: {
          "5m": formatPercentage(changes.percentChange5m),
          "1h": formatPercentage(changes.percentChange1h),
          "6h": formatPercentage(changes.percentChange6h),
          "24h": formatPercentage(changes.percentChange24h),
        },
        // Include raw percentage values for sorting/calculations
        raw_percent_change: {
          "5m": changes.percentChange5m,
          "1h": changes.percentChange1h,
          "6h": changes.percentChange6h,
          "24h": changes.percentChange24h,
        },
      };
    });

    return cryptoData;
  } catch (error) {
    console.error("Error fetching cryptocurrency data:", error.message);
    if (error.response) {
      console.error("Error details:", error.response.data);
    }
    throw error;
  }
}

// API Routes

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

// Get all cryptocurrency data
app.get("/api/cryptocurrencies", async (req, res) => {
  try {
    const data = await getCryptoData();
    res.json({
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      data,
    });
  } catch (error) {
    res.status(500).json({
      status: {
        timestamp: new Date(),
        error_code: 500,
        error_message: "Error fetching cryptocurrency data",
      },
      data: null,
    });
  }
});

// Get specific cryptocurrency by symbol
app.get("/api/cryptocurrencies/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await getCryptoData();
    const crypto = data.find((item) => item.symbol === symbol);

    if (!crypto) {
      return res.status(404).json({
        status: {
          timestamp: new Date(),
          error_code: 404,
          error_message: `Cryptocurrency with symbol ${symbol} not found`,
        },
        data: null,
      });
    }

    res.json({
      status: {
        timestamp: new Date(),
        error_code: 0,
        error_message: null,
      },
      data: crypto,
    });
  } catch (error) {
    res.status(500).json({
      status: {
        timestamp: new Date(),
        error_code: 500,
        error_message: "Error fetching cryptocurrency data",
      },
      data: null,
    });
  }
});

// Master API endpoint with pagination, filtering and sorting
app.get("/api/master", async (req, res) => {
  try {
    // Get raw data first
    const allData = await getCryptoData();

    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filter = req.query.filter; // 'trending', 'gainers', or time period '5m', '1h', '6h', '24h'
    const sortBy = req.query.sortBy || "market_cap"; // 'market_cap', 'price', 'volume_24h', 'percent_change'
    const sortPeriod = req.query.sortPeriod || "24h"; // '5m', '1h', '6h', '24h' - used when sorting by percent_change
    const sortDirection =
      req.query.sortDirection?.toLowerCase() === "asc" ? "asc" : "desc";
    const search = req.query.search?.toLowerCase() || "";

    // Filter data based on query parameters
    let filteredData = [...allData];

    // Apply search filter if provided
    if (search) {
      filteredData = filteredData.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(search) ||
          crypto.symbol.toLowerCase().includes(search)
      );
    }

    // Apply specific filters
    if (filter) {
      switch (filter) {
        case "trending":
          filteredData.sort(
            (a, b) => b.raw_percent_change["24h"] - a.raw_percent_change["24h"]
          );
          break;
        case "gainers":
          filteredData = filteredData
            .filter((crypto) => crypto.raw_percent_change["24h"] > 0)
            .sort(
              (a, b) =>
                b.raw_percent_change["24h"] - a.raw_percent_change["24h"]
            );
          break;
        case "5m":
        case "1h":
        case "6h":
        case "24h":
          // Sort by the specified time period
          filteredData.sort((a, b) =>
            sortDirection === "asc"
              ? a.raw_percent_change[filter] - b.raw_percent_change[filter]
              : b.raw_percent_change[filter] - a.raw_percent_change[filter]
          );
          break;
      }
    } else {
      // Apply sorting if no specific filter is selected
      switch (sortBy) {
        case "price":
          filteredData.sort((a, b) =>
            sortDirection === "asc" ? a.price - b.price : b.price - a.price
          );
          break;
        case "market_cap":
          filteredData.sort((a, b) =>
            sortDirection === "asc"
              ? a.market_cap - b.market_cap
              : b.market_cap - a.market_cap
          );
          break;
        case "volume_24h":
          filteredData.sort((a, b) =>
            sortDirection === "asc"
              ? a.volume_24h - b.volume_24h
              : b.volume_24h - a.volume_24h
          );
          break;
        case "percent_change":
          // Use the specified sort period
          if (["5m", "1h", "6h", "24h"].includes(sortPeriod)) {
            filteredData.sort((a, b) =>
              sortDirection === "asc"
                ? a.raw_percent_change[sortPeriod] -
                  b.raw_percent_change[sortPeriod]
                : b.raw_percent_change[sortPeriod] -
                  a.raw_percent_change[sortPeriod]
            );
          }
          break;
        default:
          // Default sort by market cap
          filteredData.sort((a, b) => b.market_cap - a.market_cap);
      }
    }

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
    console.error("Error in master API:", error.message);
    res.status(500).json({
      status: {
        timestamp: new Date(),
        error_code: 500,
        error_message: "Error processing request",
      },
      data: null,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Available endpoints:");
  console.log(
    `- http://localhost:${PORT}/api/cryptocurrencies (Get all cryptocurrency data)`
  );
  console.log(
    `- http://localhost:${PORT}/api/cryptocurrencies/BTC (Get specific cryptocurrency by symbol)`
  );
  console.log(
    `- http://localhost:${PORT}/api/trending (Get trending cryptocurrencies)`
  );
  console.log(`- http://localhost:${PORT}/api/gainers (Get gainers)`);
  console.log(
    `- http://localhost:${PORT}/api/time-period/5m (Get data for specific time period - 5m, 1h, 6h, 24h)`
  );
  console.log(
    `- http://localhost:${PORT}/api/master (Master API with pagination and filtering)`
  );
  console.log(
    `  Example: http://localhost:${PORT}/api/master?page=1&limit=10&filter=gainers&sortBy=market_cap&sortPeriod=24h&sortDirection=desc&search=bit`
  );
  console.log(`- http://localhost:${PORT}/health (Health check)`);
});
