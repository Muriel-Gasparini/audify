import { ILogger } from './ILogger';

export class ConsoleLogger implements ILogger {
  private readonly prefix: string;

  constructor(prefix: string = '[Audify]') {
    this.prefix = prefix;
  }

  public debug(message: string, ...args: unknown[]): void {
    console.debug(`${this.prefix} 🐛 ${message}`, ...args);
  }

  public info(message: string, ...args: unknown[]): void {
    console.log(`${this.prefix} ℹ️ ${message}`, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    console.warn(`${this.prefix} ⚠️ ${message}`, ...args);
  }

  public error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (error instanceof Error) {
      console.error(`${this.prefix} ❌ ${message}`, error.message, ...args);
      console.error(error.stack);
    } else if (error !== undefined) {
      console.error(`${this.prefix} ❌ ${message}`, error, ...args);
    } else {
      console.error(`${this.prefix} ❌ ${message}`, ...args);
    }
  }
}
