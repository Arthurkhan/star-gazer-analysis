// src/utils/worker/workerManager.ts
// Web Worker manager for offloading heavy processing

import { handleError, ErrorSeverity } from '@/utils/errorHandling'

// Define types for messages between main thread and worker
export interface WorkerMessage<T = any> {
  id: string;
  type: string;
  payload: T;
}

export interface WorkerResponse<T = any> {
  id: string;
  type: 'success' | 'error';
  payload: T;
}

// Worker task function type
export type WorkerTaskFunction<T, R> = (data: T) => Promise<R> | R;

/**
 * Manages a worker pool for distributing CPU-intensive tasks
 */
export class WorkerManager {
  private static instance: WorkerManager | null = null
  private workers: Worker[] = []
  private taskCallbacks: Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: number | null;
  }> = new Map()
  private maxWorkers: number
  private workerScript: string
  private taskTimeout: number
  private initialized: boolean = false
  private workerErrorCount: Map<Worker, number> = new Map()

  private constructor(options: {
    maxWorkers?: number;
    workerScript: string;
    taskTimeout?: number;
  }) {
    this.maxWorkers = options.maxWorkers || navigator.hardwareConcurrency || 2
    this.workerScript = options.workerScript
    this.taskTimeout = options.taskTimeout || 30000 // 30 seconds default
  }

  /**
   * Get the singleton instance of WorkerManager
   */
  public static getInstance(options?: {
    maxWorkers?: number;
    workerScript: string;
    taskTimeout?: number;
  }): WorkerManager {
    if (!WorkerManager.instance) {
      if (!options) {
        throw new Error('Worker manager must be initialized with options first')
      }
      WorkerManager.instance = new WorkerManager(options)
    }
    return WorkerManager.instance
  }

  /**
   * Initialize the worker pool
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Start with 2 workers (or less if maxWorkers is smaller)
      const initialWorkers = Math.min(2, this.maxWorkers)

      for (let i = 0; i < initialWorkers; i++) {
        await this.createWorker()
      }

      this.initialized = true
    } catch (error) {
      handleError(error, {
        module: 'WorkerManager',
        operation: 'initialize',
      }, ErrorSeverity.ERROR)
      throw error
    }
  }

  /**
   * Create a new worker and set up message handling
   */
  private async createWorker(): Promise<Worker> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(this.workerScript, { type: 'module' })

        // Initialize error count
        this.workerErrorCount.set(worker, 0)

        // Set up message handling
        worker.onmessage = (event) => {
          const response = event.data as WorkerResponse
          const task = this.taskCallbacks.get(response.id)

          if (task) {
            // Clear timeout if it exists
            if (task.timeout !== null) {
              clearTimeout(task.timeout)
            }

            // Handle response based on type
            if (response.type === 'success') {
              task.resolve(response.payload)
            } else {
              task.reject(new Error(response.payload))
            }

            // Remove task from callbacks
            this.taskCallbacks.delete(response.id)
          }
        }

        // Handle worker errors
        worker.onerror = (error) => {
          // Increment error count for this worker
          const errorCount = (this.workerErrorCount.get(worker) || 0) + 1
          this.workerErrorCount.set(worker, errorCount)

          // Log the error
          handleError(error, {
            module: 'WorkerManager',
            operation: 'worker.onerror',
            data: {
              errorCount,
              message: error.message,
              filename: error.filename,
              lineno: error.lineno,
            },
          }, ErrorSeverity.ERROR, false)

          // If worker has too many errors, terminate and replace it
          if (errorCount >= 3) {
            this.replaceWorker(worker)
          }
        }

        this.workers.push(worker)
        resolve(worker)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Replace a problematic worker with a new one
   */
  private async replaceWorker(worker: Worker): Promise<void> {
    try {
      // Remove the worker from the pool
      const index = this.workers.indexOf(worker)
      if (index !== -1) {
        this.workers.splice(index, 1)
      }

      // Terminate the worker
      worker.terminate()

      // Create a new worker
      await this.createWorker()

      // Clean up
      this.workerErrorCount.delete(worker)
    } catch (error) {
      handleError(error, {
        module: 'WorkerManager',
        operation: 'replaceWorker',
      }, ErrorSeverity.ERROR)
    }
  }

  /**
   * Get the least busy worker
   */
  private getWorker(): Worker {
    // If we have fewer workers than maxWorkers, create a new one
    if (this.workers.length < this.maxWorkers) {
      this.createWorker().catch(error => {
        handleError(error, {
          module: 'WorkerManager',
          operation: 'createWorker',
        }, ErrorSeverity.ERROR)
      })
    }

    // For now, use a simple round-robin approach
    const worker = this.workers[0]
    this.workers.push(this.workers.shift()!)
    return worker
  }

  /**
   * Execute a task in a worker
   */
  public async executeTask<T, R>(type: string, payload: T): Promise<R> {
    if (!this.initialized) {
      await this.initialize()
    }

    return new Promise<R>((resolve, reject) => {
      try {
        const worker = this.getWorker()
        const taskId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Set up timeout
        const timeoutId = setTimeout(() => {
          const task = this.taskCallbacks.get(taskId)
          if (task) {
            const timeoutError = new Error(`Worker task timed out after ${this.taskTimeout}ms: ${type}`)
            task.reject(timeoutError)
            this.taskCallbacks.delete(taskId)

            // Consider replacing the worker if it times out
            this.replaceWorker(worker)
          }
        }, this.taskTimeout)

        // Store callbacks and timeout
        this.taskCallbacks.set(taskId, {
          resolve,
          reject,
          timeout: timeoutId,
        })

        // Send task to worker
        const message: WorkerMessage<T> = {
          id: taskId,
          type,
          payload,
        }

        worker.postMessage(message)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Terminate all workers and clean up
   */
  public terminate(): void {
    this.workers.forEach(worker => worker.terminate())
    this.workers = []
    this.taskCallbacks.clear()
    this.initialized = false
  }
}

/**
 * Create a worker script dynamically from a set of task functions
 */
export function createWorkerScript(taskFunctions: Record<string, WorkerTaskFunction<any, any>>): string {
  // Convert the task functions to a string that can be executed in a worker
  const taskFunctionStrings = Object.entries(taskFunctions)
    .map(([name, fn]) => `"${name}": ${fn.toString()}`)
    .join(',\n')

  // Create the worker script content
  const scriptContent = `
    const tasks = {
      ${taskFunctionStrings}
    };
    
    self.onmessage = async (event) => {
      const message = event.data;
      const { id, type, payload } = message;
      
      try {
        if (!tasks[type]) {
          throw new Error(\`Unknown task type: \${type}\`);
        }
        
        const result = await tasks[type](payload);
        
        self.postMessage({
          id,
          type: 'success',
          payload: result
        });
      } catch (error) {
        self.postMessage({
          id,
          type: 'error',
          payload: error.message || String(error)
        });
      }
    };
  `

  // Create a blob URL for the script
  const blob = new Blob([scriptContent], { type: 'application/javascript' })
  return URL.createObjectURL(blob)
}
