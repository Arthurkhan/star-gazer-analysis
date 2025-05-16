// src/utils/debugger.ts
// A utility to help with debugging application issues

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class AppDebugger {
  private enabled: boolean;
  private logs: Array<{level: LogLevel, message: string, data?: any, timestamp: Date}> = [];
  private maxLogs: number = 100;
  
  constructor() {
    // Enable debugging in development mode
    this.enabled = import.meta.env.MODE === 'development' || localStorage.getItem('DEBUG_MODE') === 'true';
    
    // Initialize by logging app version and environment
    this.log('debug', 'Debugger initialized', {
      version: '0.5.0', // Match package.json version
      environment: import.meta.env.MODE,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }
  
  enable() {
    this.enabled = true;
    localStorage.setItem('DEBUG_MODE', 'true');
    this.log('info', 'Debugger enabled');
  }
  
  disable() {
    this.enabled = false;
    localStorage.removeItem('DEBUG_MODE');
    this.log('info', 'Debugger disabled');
  }
  
  log(level: LogLevel, message: string, data?: any) {
    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date()
    };
    
    // Always keep logs in memory for potential export
    this.logs.push(logEntry);
    
    // Trim logs if they exceed the maximum size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Only console log if debugging is enabled
    if (this.enabled) {
      switch (level) {
        case 'info':
          console.info(`[DEBUG:INFO] ${message}`, data);
          break;
        case 'warn':
          console.warn(`[DEBUG:WARN] ${message}`, data);
          break;
        case 'error':
          console.error(`[DEBUG:ERROR] ${message}`, data);
          break;
        case 'debug':
        default:
          console.debug(`[DEBUG] ${message}`, data);
          break;
      }
    }
  }
  
  error(message: string, error?: any) {
    const errorData = error instanceof Error 
      ? { 
          message: error.message, 
          stack: error.stack,
          name: error.name 
        } 
      : error;
      
    this.log('error', message, errorData);
    
    // Return the error for easy chaining
    return error;
  }
  
  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }
  
  info(message: string, data?: any) {
    this.log('info', message, data);
  }
  
  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }
  
  getLogs() {
    return [...this.logs];
  }
  
  // Export logs to console or as JSON
  exportLogs() {
    if (this.enabled) {
      console.group('Application Debug Logs');
      console.table(this.logs.map(log => ({
        time: log.timestamp.toLocaleTimeString(),
        level: log.level,
        message: log.message
      })));
      console.groupEnd();
    }
    
    return JSON.stringify(this.logs, null, 2);
  }
  
  // Clear logs
  clearLogs() {
    this.logs = [];
    this.log('info', 'Logs cleared');
  }
}

// Create singleton instance
export const appDebugger = new AppDebugger();

// Also export a window error handler for global error catching
export function setupGlobalErrorHandling() {
  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    appDebugger.error('Unhandled error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    appDebugger.error('Unhandled promise rejection', {
      reason: event.reason instanceof Error 
        ? { message: event.reason.message, stack: event.reason.stack }
        : event.reason
    });
  });
  
  // Log that global error handling is active
  appDebugger.info('Global error handling initialized');
}
