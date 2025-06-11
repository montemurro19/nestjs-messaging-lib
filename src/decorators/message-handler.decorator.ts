import { SetMetadata } from '@nestjs/common';

export const MESSAGE_HANDLER = 'message_handler';

export const MessageHandler = (topic: string) => SetMetadata(MESSAGE_HANDLER, topic);