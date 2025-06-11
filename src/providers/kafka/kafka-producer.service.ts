import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { MessageProducer } from '../../interfaces/message-producer.interface';

@Injectable()
export class KafkaProducerService implements MessageProducer, OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor(private readonly kafkaConfig: { brokers: string[] }) {
    this.kafka = new Kafka({
      clientId: 'nestjs-messaging-lib',
      brokers: this.kafkaConfig.brokers,
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async send(topic: string, message: any): Promise<void> {
    await this.produce(topic, message);
  }

  async produce(topic: string, message: any): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          key: message.key,
          value: JSON.stringify(message),
        },
      ],
    });
  }

  async flush(): Promise<void> {
    // Kafka producer doesn't need explicit flush
  }

  async close(): Promise<void> {
    await this.producer.disconnect();
  }
}