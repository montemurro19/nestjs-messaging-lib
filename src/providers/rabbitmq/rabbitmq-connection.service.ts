import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { connect, Connection, Channel } from 'amqplib';
import { MessagingConfig } from '../../interfaces/messaging-config.interface';

@Injectable()
export class RabbitMQConnectionService implements OnModuleInit, OnModuleDestroy {
  private connection?: Connection;
  private channel?: Channel;

  constructor(private readonly config: MessagingConfig) {}

  async onModuleInit() {
    if (this.config.rabbitmq?.uri) {
      this.connection = await connect(this.config.rabbitmq.uri);
      this.channel = await this.connection.createChannel();
      
      if (this.config.rabbitmq.queue) {
        await this.channel.assertQueue(this.config.rabbitmq.queue, { durable: true });
      }
    }
  }

  async onModuleDestroy() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  getConnection(): Connection {
    if (!this.connection) {
      throw new Error('RabbitMQ connection not established');
    }
    return this.connection;
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not established');
    }
    return this.channel;
  }
}