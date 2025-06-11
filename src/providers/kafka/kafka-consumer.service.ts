import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { MessageConsumer } from '../../interfaces/message-consumer.interface';

@Injectable()
export class KafkaConsumerService implements MessageConsumer, OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;
  private messageHandler?: (message: any) => Promise<void>;

  constructor(private readonly kafka: Kafka) {
    this.consumer = this.kafka.consumer({ groupId: 'default-group' });
  }

  async onModuleInit() {
    await this.consumer.connect();
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }

  async consume(topic: string, groupId?: string): Promise<void> {
    await this.subscribe(topic, groupId);
  }

  async subscribe(topic: string, groupId?: string): Promise<void> {
    await this.consumer.subscribe({ topic });
    
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const value = payload.message.value?.toString();
        if (value && this.messageHandler) {
          try {
            await this.messageHandler(JSON.parse(value));
          } catch (error) {
            console.error('Error processing message:', error);
          }
        }
      },
    });
  }

  onMessage(handler: (message: any) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async acknowledge(messageId: string): Promise<void> {
    // Kafka handles acknowledgment automatically
  }

  async retry(messageId: string): Promise<void> {
    // Implement retry logic here
  }

  async deadLetter(messageId: string): Promise<void> {
    // Implement dead letter logic here
  }
}