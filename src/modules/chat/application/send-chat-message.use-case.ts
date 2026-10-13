import { Inject, Injectable } from '@nestjs/common';
import { Observable, concat, of } from 'rxjs';
import {
  ChatMessage,
  ChatStreamChunk,
  RiskLevel,
} from '../domain/chat.entity';
import {
  DeterministicPreCheck,
  VERIFIED_CRISIS_RESOURCES,
} from '../domain/deterministic-precheck';
import { LLM_PORT, LlmPort } from './llm.port';

export const FIXED_HIGH_RISK_RESPONSE =
  'Noto que estás pasando por un momento muy difícil y tu bienestar es lo más importante. No estás solo/a en esto. Por favor, comunícate con estas líneas gratuitas de ayuda profesional inmediata:';

export const SYSTEM_WELLNESS_PROMPT = `
Eres un asistente empático y comprensivo de Pulso. Tu objetivo es brindar contención emocional, escucha activa y ejercicios de respiración o calma.
REGLAS NO NEGOCIABLES:
- NO eres un médico ni profesional de la salud mental.
- NUNCA diagnostiques condiciones ni recetes medicamentos ni tratamientos.
- Utiliza siempre un tono cálido, humano, en español neutro o cercano.
- No almacenes datos clínicos.
`.trim();

@Injectable()
export class SendChatMessageUseCase {
  constructor(@Inject(LLM_PORT) private readonly llmPort: LlmPort) {}

  execute(
    messages: ChatMessage[],
    systemPrompt: string = SYSTEM_WELLNESS_PROMPT,
  ): Observable<ChatStreamChunk> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const userText = lastUserMessage?.content || '';

    // Step 1: Deterministic Pre-check for safety
    const safetyResult = DeterministicPreCheck.check(userText);

    // If HIGH risk, the chat model is NEVER called. Immediately return fixed crisis response.
    if (safetyResult.riskLevel === RiskLevel.HIGH) {
      const highChunks: ChatStreamChunk[] = [
        {
          type: 'safety',
          riskLevel: RiskLevel.HIGH,
          crisisResources: VERIFIED_CRISIS_RESOURCES,
        },
        {
          type: 'token',
          token: FIXED_HIGH_RISK_RESPONSE,
        },
        {
          type: 'done',
        },
      ];
      return of(...highChunks);
    }

    // If MEDIUM risk, emit safety event with resources, and proceed with supportive prompt
    if (safetyResult.riskLevel === RiskLevel.MEDIUM) {
      const mediumNotice: ChatStreamChunk = {
        type: 'safety',
        riskLevel: RiskLevel.MEDIUM,
        crisisResources: VERIFIED_CRISIS_RESOURCES,
      };

      const contextualizedPrompt = `${systemPrompt}\n[IMPORTANTE: El usuario expresa alto malestar emocional. Sé especialmente empático, valida sus emociones y sugiere pausar para respirar juntos.]`;

      return concat(
        of(mediumNotice),
        this.llmPort.streamChat(messages, contextualizedPrompt),
      );
    }

    // LOW risk: normal streaming
    return this.llmPort.streamChat(messages, systemPrompt);
  }
}
