import { Review } from '@/types/reviews';

class BrowserAIService {
  private worker: Worker | null = null;
  private workerReady = false;
  private pendingRequests: Map<string, { 
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = new Map();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      // Create a new worker
      this.worker = new Worker(new URL('../workers/aiProcessing.worker.ts', import.meta.url), { type: 'module' });
      
      // Listen for messages from the worker
      this.worker.onmessage = (event) => {
        const { type, data, error, requestId } = event.data;
        
        switch (type) {
          case 'ready':
            console.log('AI Worker is ready');
            this.workerReady = true;
            break;
            
          case 'result':
            // Resolve the corresponding promise
            if (requestId && this.pendingRequests.has(requestId)) {
              const { resolve } = this.pendingRequests.get(requestId)!;
              this.pendingRequests.delete(requestId);
              resolve(data);
            }
            break;
            
          case 'error':
            // Reject the corresponding promise
            if (requestId && this.pendingRequests.has(requestId)) {
              const { reject } = this.pendingRequests.get(requestId)!;
              this.pendingRequests.delete(requestId);
              reject(new Error(error));
            } else {
              console.error('AI Worker error:', error);
            }
            break;
            
          default:
            console.warn(`Unknown message type from AI Worker: ${type}`);
        }
      };
      
      // Handle worker errors
      this.worker.onerror = (error) => {
        console.error('AI Worker error:', error);
        this.workerReady = false;
        
        // Reject all pending requests
        this.pendingRequests.forEach(({ reject }) => {
          reject(new Error('AI Worker encountered an error'));
        });
        this.pendingRequests.clear();
        
        // Try to restart the worker
        setTimeout(() => {
          this.restartWorker();
        }, 5000);
      };
    } catch (error) {
      console.error('Failed to initialize AI Worker:', error);
      this.worker = null;
      this.workerReady = false;
    }
  }

  private restartWorker() {
    console.log('Restarting AI Worker...');
    
    // Terminate the existing worker if it exists
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Reinitialize
    this.initWorker();
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  async analyzeReviews(reviews: Review[]): Promise<any> {
    // If the worker is not available, handle locally (fallback)
    if (!this.worker || !this.workerReady) {
      console.warn('AI Worker is not available, processing on main thread');
      return this.processLocally(reviews);
    }
    
    // Generate a unique ID for this request
    const requestId = this.generateRequestId();
    
    // Create a promise that will be resolved when the worker responds
    const promise = new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      // Set a timeout to prevent hanging requests
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('AI Worker request timed out'));
        }
      }, 30000); // 30 second timeout
    });
    
    // Send the request to the worker
    this.worker.postMessage({
      type: 'analyze',
      data: reviews,
      requestId
    });
    
    return promise;
  }

  // Fallback processing on the main thread (should be avoided)
  private processLocally(reviews: Review[]): any {
    console.log('Processing reviews on main thread:', reviews.length);
    
    // This is a simplified version of the analysis - the worker has the full implementation
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    reviews.forEach(review => {
      if (!review.sentiment) return;
      
      const sentiment = review.sentiment.toLowerCase();
      if (sentiment.includes('positive')) {
        sentimentCounts.positive++;
      } else if (sentiment.includes('negative')) {
        sentimentCounts.negative++;
      } else {
        sentimentCounts.neutral++;
      }
    });
    
    // Calculate average rating
    const totalStars = reviews.reduce((sum, review) => sum + (review.stars || 0), 0);
    const avgRating = reviews.length > 0 ? totalStars / reviews.length : 0;
    
    return {
      sentimentAnalysis: [
        { name: 'Positive', value: sentimentCounts.positive },
        { name: 'Neutral', value: sentimentCounts.neutral },
        { name: 'Negative', value: sentimentCounts.negative }
      ],
      metrics: {
        totalReviews: reviews.length,
        avgRating,
        responseRate: reviews.filter(r => r.responseFromOwnerText).length / reviews.length
      }
    };
  }
}

// Export a singleton instance
export const browserAIService = new BrowserAIService();
