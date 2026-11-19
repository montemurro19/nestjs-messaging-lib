import { KafkaConnectionService } from '../../src/providers/kafka/kafka-connection.service';
import { KafkaConsumerService } from '../../src/providers/kafka/kafka-consumer.service';
import { KafkaProducerService } from '../../src/providers/kafka/kafka-producer.service';
import { MessagingService } from '../../src/services/messaging.service';
import { MessageConsumer } from '../../src/interfaces/message-consumer.interface';
import { MessagingConfig } from '../../src/interfaces/messaging-config.interface';

type Deferred = { promise: Promise<void>; resolve: () => void; reject: (e: Error) => void };
const deferred = (): Deferred => {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const mockProducer = { connect: jest.fn(), disconnect: jest.fn(), send: jest.fn() };
const mockConsumer = { connect: jest.fn(), disconnect: jest.fn(), subscribe: jest.fn(), run: jest.fn() };

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    producer: () => mockProducer,
    consumer: () => mockConsumer,
  })),
}));

const kafkaConfig: MessagingConfig = {
  transport: 'kafka',
  kafka: { brokers: ['localhost:9092'], clientId: 'test' },
} as MessagingConfig;

// Lets pending promise callbacks run.
const flush = () => new Promise(resolve => setImmediate(resolve));

describe('KafkaConnectionService.connect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('connects producer and consumer only once, even with concurrent callers', async () => {
    const pending = deferred();
    mockProducer.connect.mockReturnValue(pending.promise);
    mockConsumer.connect.mockResolvedValue(undefined);

    const connection = new KafkaConnectionService(kafkaConfig); // constructor starts connecting
    const a = connection.connect();
    const b = connection.connect();
    pending.resolve();
    await Promise.all([a, b]);

    expect(mockProducer.connect).toHaveBeenCalledTimes(1);
    expect(mockConsumer.connect).toHaveBeenCalledTimes(1);
  });

  it('tries again on the next call after a failed connection', async () => {
    mockProducer.connect.mockRejectedValueOnce(new Error('boom')).mockResolvedValue(undefined);
    mockConsumer.connect.mockResolvedValue(undefined);

    const connection = new KafkaConnectionService(kafkaConfig); // first attempt fails
    await flush();
    await expect(connection.connect()).resolves.toBeUndefined();

    expect(mockProducer.connect).toHaveBeenCalledTimes(2);
  });
});

describe('KafkaConsumerService.subscribe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('waits for the connection before subscribing', async () => {
    const pending = deferred();
    mockProducer.connect.mockReturnValue(pending.promise);
    mockConsumer.connect.mockResolvedValue(undefined);

    const consumer = new KafkaConsumerService(new KafkaConnectionService(kafkaConfig));
    const subscribing = consumer.subscribe('topic');
    await flush();
    expect(mockConsumer.subscribe).not.toHaveBeenCalled();

    pending.resolve();
    await subscribing;
    expect(mockConsumer.subscribe).toHaveBeenCalledWith({ topic: 'topic' });
    expect(mockConsumer.run).toHaveBeenCalledTimes(1);
  });
});

describe('KafkaProducerService.produce', () => {
  beforeEach(() => jest.clearAllMocks());

  it('waits for the connection before sending', async () => {
    const pending = deferred();
    mockProducer.connect.mockReturnValue(pending.promise);
    mockConsumer.connect.mockResolvedValue(undefined);

    const producer = new KafkaProducerService(new KafkaConnectionService(kafkaConfig));
    const sending = producer.produce('topic', { a: 1 });
    await flush();
    expect(mockProducer.send).not.toHaveBeenCalled();

    pending.resolve();
    await sending;
    expect(mockProducer.send).toHaveBeenCalledTimes(1);
  });
});

describe('MessagingService.consumeMessage', () => {
  const makeConsumer = (subscribe: jest.Mock): MessageConsumer => ({
    consume: jest.fn(),
    subscribe,
    acknowledge: jest.fn(),
    retry: jest.fn(),
    deadLetter: jest.fn(),
    onMessage: jest.fn(),
  });
  const makeService = (consumer: MessageConsumer) =>
    new MessagingService({} as any, consumer, {} as any, {} as any, {} as any);

  it('registers the handler before subscribing', async () => {
    const calls: string[] = [];
    const consumer = makeConsumer(jest.fn(async () => void calls.push('subscribe')));
    (consumer.onMessage as jest.Mock).mockImplementation(() => calls.push('onMessage'));

    await makeService(consumer).consumeMessage('topic', async () => undefined);

    expect(calls).toEqual(['onMessage', 'subscribe']);
  });

  it('propagates subscription errors to the caller', async () => {
    const consumer = makeConsumer(jest.fn().mockRejectedValue(new Error('Broker not connected')));

    await expect(makeService(consumer).consumeMessage('topic', async () => undefined)).rejects.toThrow(
      'Broker not connected',
    );
  });
});
