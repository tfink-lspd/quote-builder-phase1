import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

// Create a connection pool
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000 // Return an error after 2 seconds if connection cannot be established
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err });
});

// Test database connection on startup
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info('Database connection established', {
      timestamp: result.rows[0].now
    });
    return true;
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    return false;
  }
}

// Helper function for queries with typed results
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    logger.debug('Executed query', {
      text,
      duration,
      rows: result.rowCount
    });

    return result;
  } catch (error) {
    logger.error('Query failed', {
      text,
      error
    });
    throw error;
  }
}

// Helper function for transactions
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction failed, rolled back', { error });
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool', { error });
  }
}
