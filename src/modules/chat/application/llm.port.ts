import { Observable } from 'rxjs';
import { ChatMessage, ChatStreamChunk } from '../domain/chat.entity';

export interface LlmPort {
  streamChat(messages: ChatMessage[], systemPrompt?: string): Observable<ChatStreamChunk>;
}

export const LLM_PORT = 'LLM_PORT';
