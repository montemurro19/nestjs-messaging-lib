import { Injectable, OnModuleDestroy, Inject } from '@nestjs/common';
import { Kafka, KafkaConfig, Producer, Consumer, SASLOptions, OauthbearerProviderResponse } from 'kafkajs';
import { MESSAGING_MODULE_OPTIONS_TOKEN } from '../../constants';
import { MessagingConfig } from '../../interfaces';

@Injectable()
export class KafkaConnectionService implements OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor(@Inject(MESSAGING_MODULE_OPTIONS_TOKEN) private readonly messagingConfig: MessagingConfig) {
    if (!this.messagingConfig.kafka) {
      throw new Error('Kafka configuration is missing');
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
          throw new Error('oauthBearer is not a function in Kafka SASL configuration');
        }
      } else {
        kafkaConfig.sasl = saslConfig as SASLOptions;
      }
    }

    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: this.messagingConfig.kafka.clientId + '-group' });
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }

  getProducer(): Producer {
    return this.producer;
  }

  getConsumer(): Consumer {
    return this.consumer;
  }

  onModuleDestroy() {
    this.disconnect().catch(err => console.error('Error disconnecting Kafka:', err));
  }
}