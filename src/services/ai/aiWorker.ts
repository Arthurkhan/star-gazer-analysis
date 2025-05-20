// This file defines the worker setup and provides essential exports
import { Logger } from '../../utils/logger';

const logger = new Logger('AIWorker');
let workerInstance: Worker | null = null;

// Initialize the AI worker
export function initializeAIWorker(): Worker {
  if (workerInstance) {
    return workerInstance;
  }
  
  try {
    // Create a new worker instance
    workerInstance = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    
    // Set up default error handling
    workerInstance.onerror = (error) => {
      logger.error('AI Worker error:', error);
    };
    
    logger.log('AI Worker initialized successfully');
    return workerInstance;
  } catch (error) {
    logger.error('Failed to initialize AI Worker:', error);
    throw error;
  }
}

// Clean up the AI worker
export function cleanupAIWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
    logger.log('AI Worker terminated');
  }
}

// Execute a task in the worker
export async function executeWorkerTask<T, R>(task: string, data: T): Promise<R> {
  const worker = initializeAIWorker();
  
  return new Promise<R>((resolve, reject) => {
    const messageHandler = (event: MessageEvent) => {
      const { result, error, task: taskName } = event.data;
      
      if (taskName === task) {
        worker.removeEventListener('message', messageHandler);
        
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result as R);
        }
      }
    };
    
    worker.addEventListener('message', messageHandler);
    worker.postMessage({ task, data });
  });
}

export default {
  initialize: initializeAIWorker,
  cleanup: cleanupAIWorker,
  executeTask: executeWorkerTask
};