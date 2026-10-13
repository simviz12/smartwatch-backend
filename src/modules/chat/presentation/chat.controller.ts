import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SendChatMessageUseCase } from '../application/send-chat-message.use-case';
import { ChatMessage } from '../domain/chat.entity';

export class SendChatDto {
  messages!: ChatMessage[];
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SSE Stream for conversational emotional support with crisis safety' })
  streamChat(@Body() dto: SendChatDto, @Res() res: Response) {
    if (dto.context?.opener === true && !dto.context?.stressEvent) {
      return res.status(400).json({
        statusCode: 400,
        message: 'context.opener is only allowed when context.stressEvent is true',
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const prompt = dto.context?.opener
      ? 'Eres el asistente de Pulso. El usuario acaba de abrir la conversación tras una notificación de activación corporal en su reloj. Inicia con una apertura humilde y breve, preguntando con empatía cómo se siente o si le gustaría respirar juntos.'
      : undefined;

    const subscription = this.sendChatMessageUseCase.execute(dto.messages || [], prompt).subscribe({
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
