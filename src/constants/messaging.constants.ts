export const MESSAGING_MODULE_OPTIONS_TOKEN = 'MESSAGING_MODULE_OPTIONS_TOKEN';

export const MESSAGING_CONSTANTS = {
  DEFAULT_RETRY_ATTEMPTS: 3,
  DEFAULT_DEAD_LETTER_QUEUE: 'dead-letter-queue',
  DEFAULT_MESSAGE_TIMEOUT: 30000,
  KAFKA: {
    CLIENT_ID: 'kafka-client',
    BROKER_LIST: ['localhost:9092'],
  },
  RABBITMQ: {
    URL: 'amqp://localhost',
    QUEUE_NAME: 'default-queue',
  },
};