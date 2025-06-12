import { Injectable, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import { Kafka, KafkaConfig, Producer, Consumer, SASLOptions, OauthbearerProviderResponse } from 'kafkajs';
import { MESSAGING_MODULE_OPTIONS_TOKEN } from '../../constants';
import { MessagingConfig } from '../../interfaces';

@Injectable()
export class KafkaConnectionService implements OnModuleDestroy {
  private kafka: Kafka | null = null;
  private producerInstance: Producer | null = null;
  private consumerInstance: Consumer | null = null;
  private readonly logger = new Logger(KafkaConnectionService.name);

  constructor(@Inject(MESSAGING_MODULE_OPTIONS_TOKEN) private readonly messagingConfig: MessagingConfig) {
    if (this.messagingConfig.transport === 'kafka') {
      if (!this.messagingConfig.kafka) {
        this.logger.error('Kafka transport selected, but Kafka configuration is missing.');
        return; 
      }

      const kafkaConfig: KafkaConfig = {
        brokers: this.messagingConfig.kafka.brokers,
        clientId: this.messagingConfig.kafka.clientId,
        ssl: this.messagingConfig.kafka.ssl,
      };

      if (this.messagingConfig.kafka.sasl) {
        const saslConfig = this.messagingConfig.kafka.sasl;
        if (saslConfig.mechanism === 'oauthbearer') {
          if (typeof (saslConfig as any).oauthBearer === 'function') {
            kafkaConfig.sasl = {
              mechanism: 'oauthbearer',
              oauthBearerProvider: async () => {
                const token = await (saslConfig as any).oauthBearer();
                return token as OauthbearerProviderResponse;
              },
            } as SASLOptions;
          } else {
            this.logger.error('oauthBearer is not a function in Kafka SASL configuration');
            return; 
          }
        } else {
          kafkaConfig.sasl = saslConfig as SASLOptions;
        }
      }

      try {
        this.kafka = new Kafka(kafkaConfig);
        this.producerInstance = this.kafka.producer();
        // Ensure groupId is valid, e.g., not empty if clientId can be empty
        const groupId = (this.messagingConfig.kafka.clientId || 'default-client') + '-group';
        this.consumerInstance = this.kafka.consumer({ groupId });
        // Defer connection to onModuleInit or a specific connect call if preferred
        // For now, let's attempt connection here and log errors.
        this.connect().catch(err => this.logger.error('Failed to connect Kafka producer/consumer during constructor init:', err?.message));
      } catch (error: any) {
        this.logger.error(`Error initializing Kafka client: ${error?.message}`, error?.stack);
      }
    } else {
      this.logger.log('Kafka transport not selected. KafkaConnectionService will not initialize Kafka client.');
    }
  }

  async connect(): Promise<void> {
    if (this.messagingConfig.transport !== 'kafka' || !this.producerInstance || !this.consumerInstance) {
      if (this.messagingConfig.transport === 'kafka') {
        this.logger.warn('Kafka selected, but producer/consumer not initialized. Connect call skipped.');
      }
      return;
    }
    try {
      this.logger.log('Attempting to connect Kafka producer and consumer...');
      await this.producerInstance.connect();
      await this.consumerInstance.connect();
      this.logger.log('Kafka producer and consumer connected successfully.');
    } catch (error: any) {
      this.logger.error(`Error connecting Kafka producer/consumer: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.messagingConfig.transport !== 'kafka') {
      return;
    }
    try {
      if (this.producerInstance && typeof this.producerInstance.disconnect === 'function') {
        await this.producerInstance.disconnect();
        this.logger.log('Kafka producer disconnected.');
      }
      if (this.consumerInstance && typeof this.consumerInstance.disconnect === 'function') {
        await this.consumerInstance.disconnect();
        this.logger.log('Kafka consumer disconnected.');
      }
    } catch (error: any) {
      this.logger.error(`Error disconnecting Kafka: ${error?.message}`, error?.stack);
    }
  }

  getProducer(): Producer {
    if (this.messagingConfig.transport !== 'kafka' || !this.producerInstance) {
      const msg = 'Kafka producer is not available. Kafka transport not active or not configured/initialized.';
      this.logger.error(msg);
      throw new Error(msg);
    }
    return this.producerInstance;
  }

  getConsumer(): Consumer {
    if (this.messagingConfig.transport !== 'kafka' || !this.consumerInstance) {
      const msg = 'Kafka consumer is not available. Kafka transport not active or not configured/initialized.';
      this.logger.error(msg);
      throw new Error(msg);
    }
    return this.consumerInstance;
  }

  async onModuleDestroy() {
    this.logger.log('Destroying KafkaConnectionService. Disconnecting...');
    await this.disconnect();
  }
}