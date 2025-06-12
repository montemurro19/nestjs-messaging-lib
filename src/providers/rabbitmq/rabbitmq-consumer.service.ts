import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import { Channel } from 'amqplib';
import { MessageConsumer } from '../../interfaces/message-consumer.interface';
import { RabbitMQConnectionService } from './rabbitmq-connection.service';
import { MESSAGING_MODULE_OPTIONS_TOKEN } from '../../constants';
import { MessagingConfig } from '../../interfaces/messaging-config.interface';

@Injectable()
export class RabbitMQConsumerService implements MessageConsumer, OnModuleInit, OnModuleDestroy {
  private channel?: Channel;
  private messageHandler?: (message: any) => Promise<void>;
  private readonly logger = new Logger(RabbitMQConsumerService.name);

  constructor(
    private readonly rabbitMQConnectionService: RabbitMQConnectionService,
    @Inject(MESSAGING_MODULE_OPTIONS_TOKEN) private readonly config: MessagingConfig,
  ) {}

  async onModuleInit() {
    if (this.config.transport === 'rabbitmq') {
      this.logger.log('RabbitMQ transport selected. Initializing consumer channel...');
      try {
        this.channel = this.rabbitMQConnectionService.getChannel();
        this.logger.log('RabbitMQ consumer channel initialized.');
      } catch (error: any) {
        this.logger.error(`Failed to get RabbitMQ channel for consumer: ${error?.message}`, error?.stack);
      }
    } else {
      this.logger.log('RabbitMQ transport not selected. Consumer will not initialize channel.');
    }
  }

  async consume(queue: string, groupId?: string): Promise<void> {
    if (this.config.transport !== 'rabbitmq') {
      this.logger.warn('Attempted to consume messages when RabbitMQ is not the active transport. Skipping.');
      return;
    }
    await this.subscribe(queue, groupId);
  }

  async subscribe(queue: string, groupId?: string): Promise<void> {
    if (this.config.transport !== 'rabbitmq') {
      this.logger.warn('Attempted to subscribe to queue when RabbitMQ is not the active transport. Skipping.');
      return;
    }
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.channel.assertQueue(queue, { durable: true });
    this.channel.consume(queue, async (msg) => {
      if (msg && this.messageHandler) {
        try {
          const content = JSON.parse(msg.content.toString());
          await this.messageHandler(content);
          this.channel!.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          this.channel!.nack(msg, false, false);
        }
      }
    });
  }

  onMessage(handler: (message: any) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async acknowledge(messageId: string): Promise<void> {
    // Handled in consume method
  }

  async retry(messageId: string): Promise<void> {
    // Implement retry logic here
  }

  async deadLetter(messageId: string): Promise<void> {
    // Implement dead letter logic here
  }

  async onModuleDestroy() {
    if (this.config.transport === 'rabbitmq') {
      this.logger.log('RabbitMQConsumerService destroyed. (Connection managed by RabbitMQConnectionService)');
    }
  }
}