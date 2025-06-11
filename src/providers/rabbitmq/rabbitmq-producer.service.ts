import { Injectable, OnModuleInit } from '@nestjs/common';
import { Channel } from 'amqplib';
import { MessageProducer } from '../../interfaces/message-producer.interface';
import { RabbitMQConnectionService } from './rabbitmq-connection.service';

@Injectable()
export class RabbitMQProducerService implements MessageProducer {
  private channel?: Channel;

  constructor(private rabbitMQConnectionService: RabbitMQConnectionService) {}

  async onModuleInit() {
    this.channel = this.rabbitMQConnectionService.getChannel();
  }

  async send(queue: string, message: any): Promise<void> {
    await this.produce(queue, message);
  }

  async produce(queue: string, message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }
    
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  }

  async flush(): Promise<void> {
    // RabbitMQ doesn't need explicit flush
  }

  async close(): Promise<void> {
    // Connection management handled by connection service
  }
}