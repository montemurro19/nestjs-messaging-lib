import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { MessageProducer } from '../../interfaces/message-producer.interface';
import { KafkaConnectionService } from './kafka-connection.service';

@Injectable()
export class KafkaProducerService implements MessageProducer, OnModuleInit, OnModuleDestroy {
  private producer: Producer;

  constructor(private readonly kafkaConnectionService: KafkaConnectionService) {
    this.producer = this.kafkaConnectionService.getProducer();
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