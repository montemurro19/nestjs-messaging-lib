import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from '../../src/services/messaging.service';
import { KafkaProducerService } from '../../src/providers/kafka/kafka-producer.service';
import { RabbitMQProducerService } from '../../src/providers/rabbitmq/rabbitmq-producer.service';
import { KafkaConsumerService } from '../../src/providers/kafka/kafka-consumer.service';
import { RabbitMQConsumerService } from '../../src/providers/rabbitmq/rabbitmq-consumer.service';
import { MessageProducer } from '../../src/interfaces/message-producer.interface';
import { MessageConsumer } from '../../src/interfaces/message-consumer.interface';
import { RetryService } from '../../src/services/retry.service';
import { DeadLetterService } from '../../src/services/dead-letter.service';
import { MonitoringService } from '../../src/services/monitoring.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { RabbitMQConnectionService } from '../../src/providers/rabbitmq/rabbitmq-connection.service';
import { MessagingConfig } from '../../src/interfaces/messaging-config.interface';

describe('Messaging Integration Tests', () => {
  let module: TestingModule;
  let messagingService: MessagingService;
  let kafkaProducer: KafkaProducerService;
  let rabbitMQProducer: RabbitMQProducerService;
  let kafkaConsumer: KafkaConsumerService;
  let rabbitMQConsumer: RabbitMQConsumerService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () =>
              ({
                transport: 'kafka', // Default or detect based on test
                kafka: {
                  brokers: ['localhost:9092'],
                  clientId: 'test-client',
                },
                rabbitmq: {
                  uri: 'amqp://localhost',
                  queue: 'test-queue',
                },
              } as MessagingConfig),
          ],
        }),
      ],
      providers: [
        MessagingService,
        ConfigService,
        {
          provide: RabbitMQConnectionService,
          useFactory: (configService: ConfigService) => {
            const rabbitmqConfig = configService.get<MessagingConfig['rabbitmq']>('rabbitmq');
            if (!rabbitmqConfig) {
              throw new Error('RabbitMQ config not found');
            }
            return new RabbitMQConnectionService({ transport: 'rabbitmq', rabbitmq: rabbitmqConfig });
          },
          inject: [ConfigService],
        },
        {
          provide: 'MessageProducer',
          useFactory: (configService: ConfigService, rabbitMQConnectionService: RabbitMQConnectionService) => {
            const kafkaConfig = configService.get<MessagingConfig['kafka']>('kafka');
            if (kafkaConfig && kafkaConfig.brokers) {
              return new KafkaProducerService({ brokers: kafkaConfig.brokers });
            }
            return new RabbitMQProducerService(rabbitMQConnectionService);
          },
          inject: [ConfigService, RabbitMQConnectionService],
        },
        {
          provide: 'MessageConsumer',
          useFactory: (configService: ConfigService, rabbitMQConnectionService: RabbitMQConnectionService) => {
            const kafkaConfig = configService.get<MessagingConfig['kafka']>('kafka');
            if (kafkaConfig && kafkaConfig.brokers) {
              const kafka = new Kafka({ brokers: kafkaConfig.brokers, clientId: kafkaConfig.clientId || 'test-client' });
              return new KafkaConsumerService(kafka);
            }
            return new RabbitMQConsumerService(rabbitMQConnectionService);
          },
          inject: [ConfigService, RabbitMQConnectionService],
        },
        {
          provide: KafkaProducerService,
          useFactory: (configService: ConfigService) => {
            const kafkaConfig = configService.get<MessagingConfig['kafka']>('kafka');
            if (!kafkaConfig || !kafkaConfig.brokers) {
              throw new Error('Kafka config not found or brokers not defined');
            }
            return new KafkaProducerService({ brokers: kafkaConfig.brokers });
          },
          inject: [ConfigService],
        },
        {
          provide: RabbitMQProducerService,
          useFactory: (rabbitMQConnectionService: RabbitMQConnectionService) => new RabbitMQProducerService(rabbitMQConnectionService),
          inject: [RabbitMQConnectionService],
        },
        {
          provide: KafkaConsumerService,
          useFactory: (configService: ConfigService) => {
            const kafkaConfig = configService.get<MessagingConfig['kafka']>('kafka');
            if (!kafkaConfig || !kafkaConfig.brokers) {
              throw new Error('Kafka config not found or brokers not defined');
            }
            const kafka = new Kafka({ brokers: kafkaConfig.brokers, clientId: kafkaConfig.clientId || 'test-client' });
            return new KafkaConsumerService(kafka);
          },
          inject: [ConfigService],
        },
        {
          provide: RabbitMQConsumerService,
          useFactory: (rabbitMQConnectionService: RabbitMQConnectionService) => new RabbitMQConsumerService(rabbitMQConnectionService),
          inject: [RabbitMQConnectionService],
        },
        { provide: RetryService, useValue: { handleRetry: jest.fn() } },
        { provide: DeadLetterService, useValue: { moveToDLQ: jest.fn() } },
        { provide: MonitoringService, useValue: { recordMessageProduced: jest.fn(), recordMessageConsumed: jest.fn(), recordMessageError: jest.fn() } },
      ],
    }).compile();
    await module.init(); // Initialize the module and call all onModuleInit hooks
  });

  beforeEach(async () => {
    // Instances are now retrieved in beforeEach from the module initialized in beforeAll
    messagingService = module.get<MessagingService>(MessagingService);
    kafkaProducer = module.get<KafkaProducerService>(KafkaProducerService);
    rabbitMQProducer = module.get<RabbitMQProducerService>(RabbitMQProducerService);
    kafkaConsumer = module.get<KafkaConsumerService>(KafkaConsumerService);
    rabbitMQConsumer = module.get<RabbitMQConsumerService>(RabbitMQConsumerService);
  });

  afterAll(async () => {
    await module.close(); // Close the module after all tests are done
  });

  it('should produce a message to Kafka', async () => {
    const message = { value: 'test-message' };
    const result = await kafkaProducer.send('test-topic', message);
    expect(result).toBeDefined();
  });

  it('should produce a message to RabbitMQ', async () => {
    const message = { content: 'test-message' };
    const result = await rabbitMQProducer.send('test-queue', message);
    expect(result).toBeDefined();
  });

  it('should consume a message from Kafka', async () => {
    const message = await kafkaConsumer.consume('test-topic', 'test-group');
    expect(message).toBeDefined();
  });

  it('should consume a message from RabbitMQ', async () => {
    const message = await rabbitMQConsumer.consume('test-queue', 'test-group');
    expect(message).toBeDefined();
  });
});