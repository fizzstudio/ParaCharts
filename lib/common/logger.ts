export enum LogLevel {
  NONE = 0,
  SOME = 1,
  MOST = 2,
  ALL = 3
}

let _logLevel: LogLevel = LogLevel.MOST;

/**
 * Set the global log level for all loggers.
 * @param level - The LogLevel to set (_NONE, SOME, MOST, ALL_)
 */
export function setDebugLevel(level: LogLevel) {
  _logLevel = level;
}

/**
 * Create a logger instance.
 * @param name - The name of this logger, used in log messages.
 * @param level - The log level threshold for this logger.
 */
export class Logger {
  private name: string;
  private level: LogLevel;
  constructor(name: string, level: LogLevel) {
    this.name = name;
    this.level = level;
  }

  /**
   * Log an info message. Only prints if level is ALL.
   * @param data - The data to log.
   */
  info(...data: any[]) {
    if (this.level === LogLevel.ALL) {
      console.log(`[${this.name}]`, ...data);
    }
  }

  /**
   * Log a warning message. Prints if level is MOST or ALL.
   * @param data - The data to log.
   */
  warn(...data: any[]) {
    if (this.level >= LogLevel.MOST) {
      console.warn(`[${this.name}]`, ...data);
    }
  }

  /**
   * Log an error message. Prints if level is SOME, MOST, or ALL.
   * @param data - The data to log.
   */
  error(...data: any[]) {
    if (this.level >= LogLevel.SOME) {
      console.error(`[${this.name}]`, ...data);
    }
  }
}

/**
 * Get a new Logger instance with the current global debug level.
 * @param logName - The name to assign to the logger.
 * @returns A Logger instance.
 */
export function getLogger(logName: string): Logger {
  return new Logger(logName, _logLevel);
}
