import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Channel } from 'amqplib';
import { MessageConsumer } from '../../interfaces/message-consumer.interface';
import { RabbitMQConnectionService } from './rabbitmq-connection.service';

@Injectable()
export class RabbitMQConsumerService implements MessageConsumer, OnModuleInit, OnModuleDestroy {
  private channel?: Channel;
  private messageHandler?: (message: any) => Promise<void>;

  constructor(private readonly rabbitMQConnectionService: RabbitMQConnectionService) {}

  async onModuleInit() {
    this.channel = this.rabbitMQConnectionService.getChannel();
  }

  async consume(queue: string, groupId?: string): Promise<void> {
    await this.subscribe(queue, groupId);
  }

  async subscribe(queue: string, groupId?: string): Promise<void> {
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
    // Connection management handled by connection service
  }
}