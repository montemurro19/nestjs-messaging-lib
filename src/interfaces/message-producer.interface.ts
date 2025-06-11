export interface MessageProducer {
    send(topic: string, message: any): Promise<void>;
    produce(topic: string, message: any): Promise<void>;
    flush(): Promise<void>;
    close(): Promise<void>;
}