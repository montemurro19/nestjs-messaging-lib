import { Module, DynamicModule, Global } from '@nestjs/common';
import { MessagingService } from './services/messaging.service';
import { MessagingConfig } from './interfaces/messaging-config.interface';
import { KafkaProducerService } from './providers/kafka/kafka-producer.service';
import { KafkaConsumerService } from './providers/kafka/kafka-consumer.service';
import { RabbitMQProducerService } from './providers/rabbitmq/rabbitmq-producer.service';
import { RabbitMQConsumerService } from './providers/rabbitmq/rabbitmq-consumer.service';

@Global()
@Module({})
export class MessagingModule {
  static forRoot(config: MessagingConfig): DynamicModule {
    return {
      module: MessagingModule,
      providers: [
        { provide: 'CONFIG', useValue: config },
        MessagingService,
        KafkaProducerService,
        KafkaConsumerService,
        RabbitMQProducerService,
        RabbitMQConsumerService,
      ],
      exports: [MessagingService],
    };
  }

  static forRootAsync(configProvider: {
    useFactory: (...args: any[]) => Promise<MessagingConfig> | MessagingConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: MessagingModule,
      imports: [],
      providers: [
        {
          provide: 'CONFIG',
          useFactory: configProvider.useFactory,
          inject: configProvider.inject || [],
        },
        MessagingService,
        KafkaProducerService,
        KafkaConsumerService,
        RabbitMQProducerService,
        RabbitMQConsumerService,
      ],
      exports: [MessagingService],
    };
  }
}