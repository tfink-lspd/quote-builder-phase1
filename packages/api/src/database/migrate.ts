import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';

const pool = new Pool({
  connectionString: config.databaseUrl
});

interface Migration {
  name: string;
  path: string;
}

async function getMigrationFiles(): Promise<Migration[]> {
  const migrationsDir = path.join(__dirname, 'migrations');

  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
      .map(file => ({
        name: file.replace('.sql', ''),
        path: path.join(migrationsDir, file)
      }));

    return files;
  } catch (error) {
    logger.error('Failed to read migrations directory', { error });
    return [];
  }
}

async function getExecutedMigrations(): Promise<string[]> {
  try {
    // Check if migrations table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'schema_migrations'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      return [];
    }

    const result = await pool.query(
      'SELECT migration_name FROM schema_migrations ORDER BY id'
    );

    return result.rows.map(row => row.migration_name);
  } catch (error) {
    logger.error('Failed to get executed migrations', { error });
    return [];
  }
}

async function executeMigration(migration: Migration): Promise<boolean> {
  const client = await pool.connect();

  try {
    const sql = fs.readFileSync(migration.path, 'utf8');

    logger.info(`Executing migration: ${migration.name}`);

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    logger.info(`Migration completed: ${migration.name}`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Migration failed: ${migration.name}`, { error });
    return false;
  } finally {
    client.release();
  }
}

export async function runMigrations(): Promise<void> {
  try {
    logger.info('Starting database migrations...');

    // Test database connection
    await pool.query('SELECT 1');
    logger.info('Database connection successful');

    const allMigrations = await getMigrationFiles();
    const executedMigrations = await getExecutedMigrations();

    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrations.includes(migration.name)
    );

    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info(`Found ${pendingMigrations.length} pending migration(s)`);

    for (const migration of pendingMigrations) {
      const success = await executeMigration(migration);

      if (!success) {
        throw new Error(`Migration ${migration.name} failed`);
      }
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration process failed', { error });
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration process failed', { error });
      process.exit(1);
    });
}
