export type Message = {
  id: string;
  payload: any;
  timestamp: Date;
};

export type QueueOptions = {
  durable?: boolean;
  maxLength?: number;
};

export type TopicOptions = {
  partitions?: number;
  replicationFactor?: number;
};

export type Acknowledgment = {
  ack: () => void;
  nack: () => void;
};

export type RetryOptions = {
  maxAttempts: number;
  delay: number;
};

export type DeadLetterQueueOptions = {
  enabled: boolean;
  queueName: string;
};