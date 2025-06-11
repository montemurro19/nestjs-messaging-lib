import { Injectable } from '@nestjs/common';

@Injectable()
export class DeadLetterService {
    private deadLetterQueue: any[] = [];

    addToDeadLetterQueue(message: any): void {
        this.deadLetterQueue.push(message);
    }

    getDeadLetterQueue(): any[] {
        return this.deadLetterQueue;
    }

    clearDeadLetterQueue(): void {
        this.deadLetterQueue = [];
    }

    processDeadLetterQueue(): void {
        this.deadLetterQueue.forEach(message => {
            // Logic to reprocess or log the dead letter message
            console.log('Processing dead letter message:', message);
        });
        this.clearDeadLetterQueue();
    }

    handleFailedMessage(message: any, error: Error): void {
        console.log('Handling failed message:', message, 'Error:', error.message);
        this.addToDeadLetterQueue({ message, error: error.message, timestamp: new Date() });
    }
}