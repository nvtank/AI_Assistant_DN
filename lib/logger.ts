/**
 * Logger utility with levels
 * Only logs in development, silent in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!isDevelopment) {
      // In production, only log errors
      return level === 'error';
    }
    return true;
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log('[INFO]', ...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }
  }
}

export const logger = new Logger();
