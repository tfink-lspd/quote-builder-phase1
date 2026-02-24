import { createApp } from './app';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';

async function startServer() {
  try {
    // Validate configuration
    validateConfig();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Quote Builder API started`);
      logger.info(`   Environment: ${config.nodeEnv}`);
      logger.info(`   Port: ${config.port}`);
      logger.info(`   API Prefix: ${config.apiPrefix}`);
      logger.info(`   Health check: http://localhost:${config.port}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();
