export interface MessageConsumer {
    consume(topic: string, groupId?: string): Promise<void>;
    subscribe(topic: string, groupId?: string): Promise<void>;
    acknowledge(messageId: string): Promise<void>;
    retry(messageId: string): Promise<void>;
    deadLetter(messageId: string): Promise<void>;
    onMessage(handler: (message: any) => Promise<void>): void;
}