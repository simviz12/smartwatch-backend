import { Injectable } from '@nestjs/common';
import { Observable, concat, delay, from, map, of } from 'rxjs';
import { LlmPort } from '../application/llm.port';
import { ChatMessage, ChatStreamChunk } from '../domain/chat.entity';

@Injectable()
export class MockLlmAdapter implements LlmPort {
  public callCount = 0;

  streamChat(
    messages: ChatMessage[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    systemPrompt?: string,
  ): Observable<ChatStreamChunk> {
    this.callCount++;
    const lastMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

    const replyTokens = [
      'Entiendo ',
      'lo ',
      'que ',
      'sientes. ',
      'Estoy ',
      'aquí ',
      'para ',
      'acompañarte. ',
      '¿Quieres ',
      'que ',
      'hagamos ',
      'un ',
      'ejercicio ',
      'de ',
      'respiración ',
      'juntos?',
    ];

    return concat(
      from(replyTokens).pipe(
        map((token) => ({ type: 'token' as const, token })),
      ),
      of({ type: 'done' as const }),
    );
  }
}
