const isDevelopment = __DEV__;

export const logger = {
  log: (...args: any[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: any[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
  debug: (...args: any[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  info: (...args: any[]): void => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
};
