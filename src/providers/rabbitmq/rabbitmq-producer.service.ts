import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { Channel } from 'amqplib';
import { MessageProducer } from '../../interfaces/message-producer.interface';
import { RabbitMQConnectionService } from './rabbitmq-connection.service';
import { MESSAGING_MODULE_OPTIONS_TOKEN } from '../../constants';
import { MessagingConfig } from '../../interfaces/messaging-config.interface';

@Injectable()
export class RabbitMQProducerService implements MessageProducer, OnModuleInit {
  private channel?: Channel;
  private readonly logger = new Logger(RabbitMQProducerService.name);

  constructor(
    private rabbitMQConnectionService: RabbitMQConnectionService,
    @Inject(MESSAGING_MODULE_OPTIONS_TOKEN) private readonly config: MessagingConfig,
  ) {}

  async onModuleInit() {
    if (this.config.transport === 'rabbitmq') {
      this.logger.log('RabbitMQ transport selected. Initializing producer channel...');
      try {
        this.channel = this.rabbitMQConnectionService.getChannel();
        this.logger.log('RabbitMQ producer channel initialized.');
      } catch (error: any) {
        this.logger.error(`Failed to get RabbitMQ channel for producer: ${error?.message}`, error?.stack);
      }
    } else {
      this.logger.log('RabbitMQ transport not selected. Producer will not initialize channel.');
    }
  }

  async send(queue: string, message: any): Promise<void> {
    await this.produce(queue, message);
  }

  async produce(queue: string, message: any): Promise<void> {
    if (this.config.transport !== 'rabbitmq') {
      this.logger.warn('Attempted to produce message when RabbitMQ is not the active transport. Skipping.');
      return;
    }
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