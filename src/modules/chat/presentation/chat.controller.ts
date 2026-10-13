import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SendChatMessageUseCase } from '../application/send-chat-message.use-case';
import { ChatMessage } from '../domain/chat.entity';

export class SendChatDto {
  messages: ChatMessage[];
  context?: {
    opener?: boolean;
    stressEvent?: boolean;
  };
}

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly sendChatMessageUseCase: SendChatMessageUseCase) {}

  @Post('stream')
  @ApiOperation({ summary: 'SSE Stream for conversational emotional support with crisis safety' })
  streamChat(@Body() dto: SendChatDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const subscription = this.sendChatMessageUseCase.execute(dto.messages).subscribe({
      next: (chunk) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      },
      error: (err) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
        res.end();
      },
      complete: () => {
        res.end();
      },
    });

    res.on('close', () => {
      subscription.unsubscribe();
    });
  }
}
