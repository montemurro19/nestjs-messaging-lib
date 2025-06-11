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

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.