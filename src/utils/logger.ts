/**
 * Simple logger utility for consistent logging across the application
 * Allows for namespaced logs for better traceability
 */
export class Logger {
  private namespace: string;
  private isDevelopment: boolean;

  /**
   * Create a new logger instance with a specific namespace
   * @param namespace The namespace for this logger instance
   */
  constructor(namespace: string) {
    this.namespace = namespace;
    this.isDevelopment = import.meta.env.DEV || false;
  }

  /**
   * Log an informational message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  public log(message: string, ...optionalParams: any[]): void {
    console.log(`[${this.namespace}]`, message, ...optionalParams);
  }

  /**
   * Log a warning message
   * @param message The warning message
   * @param optionalParams Additional parameters to log
   */
  public warn(message: string, ...optionalParams: any[]): void {
    console.warn(`[${this.namespace}] ⚠️`, message, ...optionalParams);
  }

  /**
   * Log an error message
   * @param message The error message
   * @param optionalParams Additional parameters to log
   */
  public error(message: string, ...optionalParams: any[]): void {
    console.error(`[${this.namespace}] 🔴`, message, ...optionalParams);
  }

  /**
   * Log a debug message (only in development mode)
   * @param message The debug message
   * @param optionalParams Additional parameters to log
   */
  public debug(message: string, ...optionalParams: any[]): void {
    if (this.isDevelopment) {
      console.debug(`[${this.namespace}] 🔍`, message, ...optionalParams);
    }
  }

  /**
   * Log a success message
   * @param message The success message
   * @param optionalParams Additional parameters to log
   */
  public success(message: string, ...optionalParams: any[]): void {
    console.log(`[${this.namespace}] ✅`, message, ...optionalParams);
  }
}

// Create a default application logger
export const appLogger = new Logger('App');

export default Logger;
