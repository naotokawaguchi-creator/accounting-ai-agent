type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug(`[${timestamp()}] [DEBUG] ${message}`, ...args);
    }
  },
  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.log(`[${timestamp()}] [INFO] ${message}`, ...args);
    }
  },
  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(`[${timestamp()}] [WARN] ${message}`, ...args);
    }
  },
  error(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(`[${timestamp()}] [ERROR] ${message}`, ...args);
    }
  },
};
