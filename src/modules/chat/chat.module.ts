import { Module } from '@nestjs/common';
import { LLM_PORT } from './application/llm.port';
import { SendChatMessageUseCase } from './application/send-chat-message.use-case';
import { MockLlmAdapter } from './infrastructure/mock-llm.adapter';
import { ChatController } from './presentation/chat.controller';

@Module({
  controllers: [ChatController],
  providers: [
    SendChatMessageUseCase,
    {
      provide: LLM_PORT,
      useClass: MockLlmAdapter,
    },
  ],
  exports: [SendChatMessageUseCase],
})
export class ChatModule {}
