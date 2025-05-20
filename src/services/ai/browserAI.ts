import { Logger } from '../../utils/logger';
import aiWorker, { cleanupAIWorker } from './aiWorker';

const logger = new Logger('BrowserAI');

/**
 * Browser-based AI implementation that uses web workers for processing
 */
class BrowserAI {
  private logger = new Logger('BrowserAI');

  /**
   * Generate recommendations using browser-based processing
   */
  async generateRecommendations(userInput: any): Promise<any> {
    try {
      this.logger.log('Generating recommendations with browser AI...');
      
      // Use the worker to generate recommendations
      const result = await aiWorker.executeTask('generateSimpleRecommendations', userInput);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate recommendations');
      }
      
      this.logger.log('Browser AI generated recommendations successfully');
      return { recommendations: result.recommendations };
    } catch (error) {
      this.logger.error('Error generating browser AI recommendations:', error);
      throw new Error('Browser AI failed to generate recommendations');
    }
  }
  
  /**
   * Cleanup resources when the service is no longer needed
   */
  cleanup(): void {
    cleanupAIWorker();
  }
}

export default BrowserAI;