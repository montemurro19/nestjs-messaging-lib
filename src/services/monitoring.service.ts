import { Injectable } from '@nestjs/common';

@Injectable()
export class MonitoringService {
    private healthStatus: boolean = true;
    private messagesSent: number = 0;
    private messagesReceived: number = 0;

    checkHealth(): boolean {
        return this.healthStatus;
    }

    setHealthStatus(status: boolean): void {
        this.healthStatus = status;
    }

    trackMessageSent(topic: string): void {
        this.messagesSent++;
        console.log(`Message sent to topic: ${topic}. Total sent: ${this.messagesSent}`);
    }

    trackMessageReceived(topic: string): void {
        this.messagesReceived++;
        console.log(`Message received from topic: ${topic}. Total received: ${this.messagesReceived}`);
    }

    getMetrics(): object {
        return {
            uptime: process.uptime(),
            health: this.healthStatus,
            messagesSent: this.messagesSent,
            messagesReceived: this.messagesReceived,
        };
    }
}