const pino = require('pino');

const PinoLevelToSeverityLookup = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL'
};

const defaultPinoConf = {
  messageKey: 'message',
  formatters: {
    bindings: () => ({}),
    level: (label) => {
      return {
        severity: PinoLevelToSeverityLookup[label] || PinoLevelToSeverityLookup.info
      };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime
};

const logger = pino(defaultPinoConf);

module.exports = { logger };
