import { Module, DynamicModule, Global, Provider } from '@nestjs/common';
import { MessagingService } from './services/messaging.service';
import { MessagingConfig } from './interfaces/messaging-config.interface';
import { KafkaProducerService } from './providers/kafka/kafka-producer.service';
import { KafkaConsumerService } from './providers/kafka/kafka-consumer.service';
import { RabbitMQProducerService } from './providers/rabbitmq/rabbitmq-producer.service';
import { RabbitMQConsumerService } from './providers/rabbitmq/rabbitmq-consumer.service';
import { RetryService } from './services/retry.service';
import { DeadLetterService } from './services/dead-letter.service';
import { MonitoringService } from './services/monitoring.service';
import { MESSAGING_MODULE_OPTIONS_TOKEN } from './constants';
import { KafkaConnectionService } from './providers/kafka/kafka-connection.service';
import { RabbitMQConnectionService } from './providers/rabbitmq/rabbitmq-connection.service';

@Global()
@Module({})
export class MessagingModule {
  static forRoot(config: MessagingConfig): DynamicModule {
    const producerProvider: Provider = {
      provide: 'MessageProducer',
      useFactory: (
        kafkaConnectionService: KafkaConnectionService,
        rabbitMQConnectionService: RabbitMQConnectionService,
      ) => {
        if (config.transport === 'kafka') {
          if (!config.kafka) {
            throw new Error('Kafka configuration is required when transport is set to "kafka".');
          }
          return new KafkaProducerService(kafkaConnectionService);
        }
        return new RabbitMQProducerService(rabbitMQConnectionService);
      },
      inject: [KafkaConnectionService, RabbitMQConnectionService],
    };

    const consumerProvider: Provider = {
      provide: 'MessageConsumer',
      useFactory: (
        kafkaConnectionService: KafkaConnectionService,
        rabbitMQConnectionService: RabbitMQConnectionService,
      ) => {
        if (config.transport === 'kafka') {
          return new KafkaConsumerService(kafkaConnectionService);
        }
        return new RabbitMQConsumerService(rabbitMQConnectionService);
      },
      inject: [KafkaConnectionService, RabbitMQConnectionService],
    };

    return {
      module: MessagingModule,
      providers: [
        { provide: MESSAGING_MODULE_OPTIONS_TOKEN, useValue: config },
        MessagingService,
        producerProvider,
        consumerProvider,
        RetryService,
        DeadLetterService,
        MonitoringService,
        KafkaProducerService,
        KafkaConsumerService,
        RabbitMQProducerService,
        RabbitMQConsumerService,
        KafkaConnectionService,
        RabbitMQConnectionService,
      ],
      exports: [
        MessagingService,
        'MessageProducer',
        'MessageConsumer',
      ],
    };
  }

  static forRootAsync(configProvider: {
    useFactory: (...args: any[]) => Promise<MessagingConfig> | MessagingConfig;
    inject?: any[];
    imports?: any[];
  }): DynamicModule {
    const producerProvider: Provider = {
      provide: 'MessageProducer',
      useFactory: (
        config: MessagingConfig,
        kafkaConnectionService: KafkaConnectionService,
        rabbitMQConnectionService: RabbitMQConnectionService,
      ) => {
        if (config.transport === 'kafka') {
          if (!config.kafka) {
            throw new Error('Kafka configuration is required when transport is set to "kafka".');
          }
          return new KafkaProducerService(kafkaConnectionService);
        }
        return new RabbitMQProducerService(rabbitMQConnectionService);
      },
      inject: [MESSAGING_MODULE_OPTIONS_TOKEN, KafkaConnectionService, RabbitMQConnectionService],
    };

    const consumerProvider: Provider = {
      provide: 'MessageConsumer',
      useFactory: (
        config: MessagingConfig,
        kafkaConnectionService: KafkaConnectionService,
        rabbitMQConnectionService: RabbitMQConnectionService,
      ) => {
        if (config.transport === 'kafka') {
          return new KafkaConsumerService(kafkaConnectionService);
        }
        return new RabbitMQConsumerService(rabbitMQConnectionService);
      },
      inject: [MESSAGING_MODULE_OPTIONS_TOKEN, KafkaConnectionService, RabbitMQConnectionService],
    };

    return {
      module: MessagingModule,
      imports: configProvider.imports || [],
      providers: [
        {
          provide: MESSAGING_MODULE_OPTIONS_TOKEN,
          useFactory: configProvider.useFactory,
          inject: configProvider.inject || [],
        },
        MessagingService,
        producerProvider,
        consumerProvider,
        RetryService,
        DeadLetterService,
        MonitoringService,
        KafkaProducerService,
        KafkaConsumerService,
        RabbitMQProducerService,
        RabbitMQConsumerService,
        KafkaConnectionService,
        RabbitMQConnectionService,
      ],
      exports: [
        MessagingService,
        'MessageProducer',
        'MessageConsumer',
      ],
    };
  }
}