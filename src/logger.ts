import pino from 'pino';

const logger = pino({ name: 'queue-processor', level: process.env.LOG_LEVEL || 'info' });

export { logger };