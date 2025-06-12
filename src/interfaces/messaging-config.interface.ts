export interface MessagingConfig {
  transport: 'kafka' | 'rabbitmq';
  kafka?: {
    brokers: string[];
    clientId: string;
    sasl?: {
      mechanism: string;
      username: string;
      password: string;
    } | { mechanism: 'oauthbearer'; oauthBearer: () => Promise<{ value: string }> };
    ssl?: boolean;
  };
  rabbitmq?: {
    uri: string;
    queue: string;
    username?: string;
    password?: string;
  };
  retryAttempts?: number;
  deadLetterQueue?: string;
  monitoring?: {
    enabled: boolean;
    endpoint: string;
  };
}