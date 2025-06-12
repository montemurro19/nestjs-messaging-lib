import { Injectable, Inject } from '@nestjs/common';
import { MessageProducer } from '../interfaces/message-producer.interface';
import { MessageConsumer } from '../interfaces/message-consumer.interface';
import { MessagingConfig } from '../interfaces/messaging-config.interface';
import { RetryService } from './retry.service';
import { DeadLetterService } from './dead-letter.service';
import { MonitoringService } from './monitoring.service';
import { MESSAGE_PRODUCER_TOKEN, MESSAGE_CONSUMER_TOKEN } from '../messaging.module'; // Import tokens

@Injectable()
export class MessagingService {
  constructor(
    @Inject(MESSAGE_PRODUCER_TOKEN) private readonly producer: MessageProducer, // Use token
    @Inject(MESSAGE_CONSUMER_TOKEN) private readonly consumer: MessageConsumer, // Use token
    private readonly retryService: RetryService,
    private readonly deadLetterService: DeadLetterService,
    private readonly monitoringService: MonitoringService,
  ) {}

  async produceMessage(topic: string, message: any): Promise<void> {
    try {
      await this.producer.send(topic, message);
      this.monitoringService.trackMessageSent(topic);
    } catch (error) {
      this.retryService.retryMessage(topic, message, error as Error);
    }
  }

  async consumeMessage(topic: string, handler: (message: any) => Promise<void>): Promise<void> {
    this.consumer.subscribe(topic);
    this.consumer.onMessage(async (message) => {
      try {
        await handler(message);
        this.consumer.acknowledge(message);
      } catch (error) {
        this.deadLetterService.handleFailedMessage(message, error as Error);
      }
    });
  }
}