# NestJS Messaging Library

## Overview

The NestJS Messaging Library provides a generic messaging abstraction that supports both Kafka and RabbitMQ. It simplifies the management of queues and topics, enabling seamless message production, consumption, acknowledgment, retry mechanisms, and dead letter queue handling.

## Features

- **Message Production**: Easily send messages to Kafka and RabbitMQ.
- **Message Consumption**: Consume messages from both messaging systems.
- **Acknowledgment**: Handle message acknowledgment to ensure reliable processing.
- **Retry Mechanism**: Automatically retry message processing on failure.
- **Dead Letter Queue**: Manage messages that fail processing and route them to a dead letter queue.
- **Monitoring**: Built-in health checks and monitoring functionalities.
- **Connection Management**: Efficiently manage connections to Kafka and RabbitMQ brokers.
- **Authentication Support**: Configure authentication for secure connections.
- **Dynamic Module**: Use `forRoot()` and `forRootAsync()` for configurable dependency injection.

## Installation

To install the library, run:

```bash
npm install nestjs-messaging-lib
```

## Usage

### Basic Setup

Import the `MessagingModule` in your NestJS application module:

```typescript
import { Module } from '@nestjs/common';
import { MessagingModule } from 'nestjs-messaging-lib';

@Module({
  imports: [
    MessagingModule.forRoot({
      // Configuration options
    }),
  ],
})
export class AppModule {}
```

### Asynchronous Configuration

For asynchronous configuration, use `forRootAsync()`:

```typescript
import { Module } from '@nestjs/common';
import { MessagingModule } from 'nestjs-messaging-lib';

@Module({
  imports: [
    MessagingModule.forRootAsync({
      useFactory: async () => ({
        // Configuration options
      }),
    }),
  ],
})
export class AppModule {}
```

### Using the MessagingService

The `MessagingService` provides methods for producing and consuming messages.

**Producing Messages**

To produce a message, inject the `MessagingService` and call the `produceMessage` method:

```typescript
import { Injectable } from '@nestjs/common';
import { MessagingService } from 'nestjs-messaging-lib';

@Injectable()
export class MyService {
  constructor(private readonly messagingService: MessagingService) {}

  async sendMessage() {
    await this.messagingService.produceMessage('my-topic', { key: 'value' });
  }
}
```

**Consuming Messages**

To consume messages, use the `consumeMessage` method. You'll typically do this in a service that implements a message handler.

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MessagingService } from 'nestjs-messaging-lib';

@Injectable()
export class MyConsumerService implements OnModuleInit {
  constructor(private readonly messagingService: MessagingService) {}

  onModuleInit() {
    this.messagingService.consumeMessage('my-topic', this.handleMessage.bind(this));
  }

  async handleMessage(message: any): Promise<void> {
    console.log('Received message:', message);
    // Process the message
  }
}
```

Alternatively, you can use the `@MessageHandler` decorator on a method within a class that is registered as a provider.

```typescript
import { Injectable } from '@nestjs/common';
import { MessageHandler } from 'nestjs-messaging-lib';

@Injectable()
export class MyDecoratedConsumerService {
  @MessageHandler('my-topic')
  async handleMessage(message: any): Promise<void> {
    console.log('Received message via decorator:', message);
    // Process the message
  }
}
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.