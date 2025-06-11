import { Injectable } from '@nestjs/common';

@Injectable()
export class RetryService {
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(maxRetries: number = 5, retryDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async retryMessage(topic: string, message: any, error: Error): Promise<void> {
    console.log(`Retrying message for topic ${topic}:`, error.message);
    // Implement retry logic here
  }

  async retry<T>(fn: () => Promise<T>): Promise<T> {
    let attempts = 0;

    while (attempts < this.maxRetries) {
      try {
        return await fn();
      } catch (error) {
        attempts++;
        if (attempts >= this.maxRetries) {
          throw error;
        }
        await this.delay(this.retryDelay);
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}