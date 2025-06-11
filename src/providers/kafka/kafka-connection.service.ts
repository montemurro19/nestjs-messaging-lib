import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kafka, KafkaConfig, Producer, Consumer } from 'kafkajs';

@Injectable()
export class KafkaConnectionService implements OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor(private readonly config: KafkaConfig) {
    this.kafka = new Kafka(this.config);
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'default-group' });
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