// src/services/logging/loggingService.ts
// Centralized logging service for application monitoring

import { appLogger } from '@/utils/logger'
import { safeLocalStorage } from '@/utils/storage/safeStorage'
import { ErrorSeverity } from '@/utils/errorHandling'

// Error event data structure
interface ErrorEvent {
  timestamp: string;
  message: string;
  severity: ErrorSeverity;
  module?: string;
  component?: string;
  stack?: string;
  metadata?: any;
}

// Configuration for the logging service
interface LoggingConfig {
  bufferSize?: number;
  flushInterval?: number;
  persistLogs?: boolean;
  consoleOutput?: boolean;
}

/**
 * Centralized logging service to collect, buffer and report errors
 */
export class LoggingService {
  private static instance: LoggingService
  private errorBuffer: ErrorEvent[] = []
  private warningBuffer: ErrorEvent[] = []
  private bufferSize: number
  private flushInterval: number
  private persistLogs: boolean
  private consoleOutput: boolean
  private flushTimer: number | null = null
  private isInitialized: boolean = false

  private constructor(config: LoggingConfig = {}) {
    this.bufferSize = config.bufferSize || 50
    this.flushInterval = config.flushInterval || 30000 // 30 seconds
    this.persistLogs = config.persistLogs !== undefined ? config.persistLogs : true
    this.consoleOutput = config.consoleOutput !== undefined ? config.consoleOutput : true

    // Load persisted logs if enabled
    if (this.persistLogs) {
      this.loadPersistedLogs()
    }
  }

  /**
   * Get the singleton instance of the logging service
   */
  public static getInstance(config?: LoggingConfig): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService(config)
    }
    return LoggingService.instance
  }

  /**
   * Initialize the logging service and start the flush timer
   */
  public initialize(): void {
    if (this.isInitialized) return

    // Start the flush timer
    if (this.flushInterval > 0) {
      this.flushTimer = window.setInterval(() => {
        this.flush()
      }, this.flushInterval)
    }

    // Subscribe to window unload to persist logs
    window.addEventListener('beforeunload', () => {
      this.persistLogsToStorage()
    })

    this.isInitialized = true
    appLogger.info('Logging service initialized')
  }

  /**
   * Log an error event
   */
  public logError(
    message: string,
    severity: ErrorSeverity = ErrorSeverity.HIGH,
    metadata: any = {},
  ): void {
    const errorEvent: ErrorEvent = {
      timestamp: new Date().toISOString(),
      message,
      severity,
      ...metadata,
    }

    // Add to appropriate buffer based on severity
    if (severity === ErrorSeverity.HIGH) {
      this.errorBuffer.push(errorEvent)

      // Trim if buffer exceeds max size
      if (this.errorBuffer.length > this.bufferSize) {
        this.errorBuffer = this.errorBuffer.slice(-this.bufferSize)
      }
    } else {
      this.warningBuffer.push(errorEvent)

      // Trim if buffer exceeds max size
      if (this.warningBuffer.length > this.bufferSize) {
        this.warningBuffer = this.warningBuffer.slice(-this.bufferSize)
      }
    }

    // Output to console if enabled
    if (this.consoleOutput) {
      switch (severity) {
        case ErrorSeverity.LOW:
          appLogger.info(message, metadata)
          break
        case ErrorSeverity.MEDIUM:
          appLogger.warn(message, metadata)
          break
        case ErrorSeverity.HIGH:
          appLogger.error(message, metadata)
          break
      }
    }

    // Auto-flush on high severity errors
    if (severity === ErrorSeverity.HIGH) {
      this.flush()
    }
  }

  /**
   * Flush logs to persistent storage and optionally to server
   */
  public flush(): void {
    // Persist logs to localStorage
    this.persistLogsToStorage()

    // Here you would also send logs to server if implemented
    // this.sendLogsToServer();

    appLogger.info('Logs flushed', {
      errorCount: this.errorBuffer.length,
      warningCount: this.warningBuffer.length,
    })
  }

  /**
   * Get all logged errors
   */
  public getErrors(): ErrorEvent[] {
    return [...this.errorBuffer]
  }

  /**
   * Get all logged warnings
   */
  public getWarnings(): ErrorEvent[] {
    return [...this.warningBuffer]
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): any {
    const moduleStats = new Map<string, number>()
    const severityCounts = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
    }

    // Process error buffer
    this.errorBuffer.forEach(error => {
      // Count by module
      const module = error.module || 'unknown'
      moduleStats.set(module, (moduleStats.get(module) || 0) + 1)

      // Count by severity
      severityCounts[error.severity]++
    })

    // Process warning buffer for severity counts
    this.warningBuffer.forEach(warning => {
      severityCounts[warning.severity]++
    })

    return {
      total: this.errorBuffer.length + this.warningBuffer.length,
      errors: this.errorBuffer.length,
      warnings: this.warningBuffer.length,
      byModule: Object.fromEntries(moduleStats),
      bySeverity: severityCounts,
      lastError: this.errorBuffer.length > 0 ? this.errorBuffer[this.errorBuffer.length - 1] : null,
    }
  }

  /**
   * Clear all logged errors and warnings
   */
  public clearLogs(): void {
    this.errorBuffer = []
    this.warningBuffer = []
    this.persistLogsToStorage()
    appLogger.info('Logs cleared')
  }

  /**
   * Save logs to localStorage
   */
  private persistLogsToStorage(): void {
    if (!this.persistLogs) return

    try {
      // Only keep the most recent logs
      const errorsToSave = this.errorBuffer.slice(-this.bufferSize)
      const warningsToSave = this.warningBuffer.slice(-this.bufferSize)

      safeLocalStorage.setJSON('error_logs', errorsToSave)
      safeLocalStorage.setJSON('warning_logs', warningsToSave)
    } catch (error) {
      appLogger.error('Failed to persist logs to storage', error)
    }
  }

  /**
   * Load persisted logs from localStorage
   */
  private loadPersistedLogs(): void {
    try {
      const savedErrors = safeLocalStorage.getJSON<ErrorEvent[]>('error_logs', [])
      const savedWarnings = safeLocalStorage.getJSON<ErrorEvent[]>('warning_logs', [])

      this.errorBuffer = savedErrors
      this.warningBuffer = savedWarnings

      appLogger.info('Loaded persisted logs', {
        errorCount: savedErrors.length,
        warningCount: savedWarnings.length,
      })
    } catch (error) {
      appLogger.error('Failed to load persisted logs', error)
    }
  }

  /**
   * Stop the logging service and clean up
   */
  public dispose(): void {
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }

    // Final flush before disposing
    this.flush()
    this.isInitialized = false
  }
}

// Create and export default instance
export const loggingService = LoggingService.getInstance()
export default loggingService
