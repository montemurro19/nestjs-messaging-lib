import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import { connect, Connection, Channel } from 'amqplib';
import { MESSAGING_MODULE_OPTIONS_TOKEN } from '../../constants';
import { MessagingConfig } from '../../interfaces/messaging-config.interface';

@Injectable()
export class RabbitMQConnectionService implements OnModuleInit, OnModuleDestroy {
  private connection?: Connection;
  private channel?: Channel;
  private readonly logger = new Logger(RabbitMQConnectionService.name);

  constructor(@Inject(MESSAGING_MODULE_OPTIONS_TOKEN) private readonly config: MessagingConfig) {}

  async onModuleInit() {
    if (this.config.transport === 'rabbitmq') {
      this.logger.log('RabbitMQ transport selected. Initializing RabbitMQ connection...');
      if (!this.config.rabbitmq?.uri) {
        this.logger.error('RabbitMQ transport selected, but RabbitMQ URI is missing.');
        return;
      }
      try {
        this.connection = await connect(this.config.rabbitmq.uri);
        this.channel = await this.connection.createChannel();
        this.logger.log('RabbitMQ connection and channel established.');

        if (this.config.rabbitmq.queue) {
          await this.channel.assertQueue(this.config.rabbitmq.queue, { durable: true });
          this.logger.log(`RabbitMQ queue '${this.config.rabbitmq.queue}' asserted.`);
        }
      } catch (error: any) {
        this.logger.error(`Failed to initialize RabbitMQ: ${error?.message}`, error?.stack);
        // Optionally rethrow or handle to prevent application from starting if RabbitMQ is critical
      }
    } else {
      this.logger.log('RabbitMQ transport not selected. RabbitMQConnectionService will not initialize.');
    }
  }

  async onModuleDestroy() {
    if (this.config.transport === 'rabbitmq') {
      this.logger.log('Destroying RabbitMQConnectionService. Closing channel and connection...');
      try {
        if (this.channel) {
          await this.channel.close();
          this.logger.log('RabbitMQ channel closed.');
        }
        if (this.connection) {
          await this.connection.close();
          this.logger.log('RabbitMQ connection closed.');
        }
      } catch (error: any) {
        this.logger.error(`Error closing RabbitMQ resources: ${error?.message}`, error?.stack);
      }
    }
  }

  getConnection(): Connection {
    if (this.config.transport !== 'rabbitmq' || !this.connection) {
      const msg = 'RabbitMQ connection not established or RabbitMQ is not the active transport.';
      this.logger.error(msg);
      throw new Error(msg);
    }
    return this.connection;
  }

  getChannel(): Channel {
    if (this.config.transport !== 'rabbitmq' || !this.channel) {
      const msg = 'RabbitMQ channel not established or RabbitMQ is not the active transport.';
      this.logger.error(msg);
      throw new Error(msg);
    }
    return this.channel;
  }
}