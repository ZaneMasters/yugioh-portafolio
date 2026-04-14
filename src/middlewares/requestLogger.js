'use strict';

const morgan = require('morgan');
const logger = require('../utils/logger');

/**
 * Stream personalizado para que Morgan escriba a través de Winston.
 */
const morganStream = {
  write: (message) => logger.http(message.trim()),
};

/**
 * Formato Morgan personalizado:
 *   METHOD /path STATUS - time ms
 */
const format = ':method :url :status :res[content-length] - :response-time ms';

const requestLogger = morgan(format, { stream: morganStream });

module.exports = requestLogger;
