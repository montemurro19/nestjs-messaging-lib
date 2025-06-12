import { Injectable, Inject } from '@nestjs/common';
import { MESSAGING_MODULE_OPTIONS_TOKEN } from '../constants';
import { MessagingConfig } from '../interfaces/messaging-config.interface';

@Injectable()
export class RetryService {
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(@Inject(MESSAGING_MODULE_OPTIONS_TOKEN) config: MessagingConfig) {
    this.maxRetries = config.retryAttempts ?? 5;
    this.retryDelay = config.retryDelay ?? 1000;
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