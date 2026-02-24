import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  // Database
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'quote_builder_dev',
    user: process.env.DATABASE_USER || 'quote_builder',
    password: process.env.DATABASE_PASSWORD || 'password'
  },

  // Database URL (use DATABASE_URL or construct from individual values)
  get databaseUrl(): string {
    if (this.database.url) {
      return this.database.url;
    }
    const { user, password, host, port, name } = this.database;
    return `postgresql://${user}:${password}@${host}:${port}/${name}`;
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Integration configuration
  integrations: {
    useMockCatalog: process.env.USE_MOCK_CATALOG === 'true',
    useMockTax: process.env.USE_MOCK_TAX === 'true',
    useMockPayments: process.env.USE_MOCK_PAYMENTS === 'true',
    fallbackToMockOnError: process.env.FALLBACK_TO_MOCK_ON_ERROR === 'true',

    // X-Series API URLs
    xSeriesCatalogUrl: process.env.X_SERIES_CATALOG_API_URL,
    xSeriesTaxUrl: process.env.X_SERIES_TAX_API_URL,
    xSeriesPaymentUrl: process.env.X_SERIES_PAYMENT_API_URL,
    xSeriesAuthUrl: process.env.X_SERIES_AUTH_API_URL
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

// Validate required configuration
export function validateConfig(): void {
  const required: (keyof typeof config)[] = ['port'];

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }
}
