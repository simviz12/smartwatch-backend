import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../shared/errors/app.error';
import { DeterministicPreCheck } from '../../chat/domain/deterministic-precheck';
import { CrisisResource, RiskLevel } from '../../chat/domain/chat.entity';

export interface AssistantTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface AssistantLlmPort {
  readonly configured: boolean;
  reply(systemPrompt: string, history: AssistantTurn[], message: string): Promise<string>;
}

export interface RateLimiterPort {
  /** Returns false when the user exceeded the allowance. */
  tryConsume(userId: string): boolean;
}

export const ASSISTANT_LLM = Symbol('ASSISTANT_LLM');
export const ASSISTANT_RATE_LIMITER = Symbol('ASSISTANT_RATE_LIMITER');

export interface AssistantReply {
  reply: string;
  riskLevel: RiskLevel;
  suggestsBreathing: boolean;
  crisisResources?: CrisisResource[];
}

const SYSTEM_ES =
  'Eres el asistente emocional y de bienestar de Pulso, una app que acompaña a personas que usan un reloj ' +
  'inteligente que detecta tensión a partir del pulso y la HRV. Habla siempre en español, con calidez, ' +
  'empatía y brevedad (2 a 3 oraciones). Valida lo que siente la persona y, si encaja, ofrece una técnica ' +
  'de respiración corta (4-6, caja 4-4-4-4 o 4-7-8). Nunca des diagnósticos médicos ni recetes medicamentos. ' +
  'Si la persona expresa riesgo para su vida, anímala a llamar a la línea 106 o al 123 en Colombia.';

const SYSTEM_EN =
  'You are the emotional wellness assistant of Pulso, an app for people wearing a smartwatch that detects ' +
  'tension from heart rate and HRV. Always reply in English, warmly, empathetically and briefly (2 to 3 sentences). ' +
  'Validate feelings and, when it fits, offer a short breathing technique (4-6, box 4-4-4-4 or 4-7-8). ' +
  'Never give medical diagnoses or prescribe medication. If the person expresses a risk to their life, ' +
  'encourage them to contact local emergency services or a crisis line.';

@Injectable()
export class AskAssistantUseCase {
  constructor(
    @Inject(ASSISTANT_LLM) private readonly llm: AssistantLlmPort,
    @Inject(ASSISTANT_RATE_LIMITER) private readonly limiter: RateLimiterPort,
  ) {}

  async execute(input: {
    userId: string;
    message: string;
    language?: string;
    history?: AssistantTurn[];
  }): Promise<AssistantReply> {
    const english = (input.language ?? 'ES').toUpperCase() === 'EN';
    const message = input.message.trim();

    // Safety first: high-risk messages never go to the model.
    const safety = DeterministicPreCheck.check(message);
    if (safety.riskLevel === RiskLevel.HIGH) {
      return {
        reply: english
          ? 'I’m really glad you told me. You deserve support right now: please call a crisis line or your local emergency number. In Colombia you can call 106 or 123, any time. I’m here with you.'
          : 'Gracias por contármelo. Mereces apoyo ahora mismo: por favor llama a la línea 106 (gratuita, 24 horas) o al 123. No estás solo ni sola; aquí sigo contigo.',
        riskLevel: RiskLevel.HIGH,
        suggestsBreathing: false,
        crisisResources: safety.crisisResources,
      };
    }

    if (!this.llm.configured) {
      throw new AppError('AI_NOT_CONFIGURED', 'El asistente con IA no está configurado en el servidor.', HttpStatus.SERVICE_UNAVAILABLE);
    }
    if (!this.limiter.tryConsume(input.userId)) {
      throw new AppError(
        'RATE_LIMITED',
        english ? 'You’ve sent many messages. Take a breath and try again in a little while.' : 'Has enviado muchos mensajes. Respira un momento y vuelve a intentarlo en un rato.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const history = (input.history ?? []).slice(-10);
    let reply = (await this.llm.reply(english ? SYSTEM_EN : SYSTEM_ES, history, message)).trim();
    if (!reply) {
      reply = english
        ? 'I’m here with you. Let’s take a slow breath together: in for 4 seconds, out for 6.'
        : 'Estoy aquí contigo. Respiremos despacio juntos: inhala 4 segundos y exhala 6.';
    }

    const medium = safety.riskLevel === RiskLevel.MEDIUM;
    return {
      reply,
      riskLevel: safety.riskLevel,
      suggestsBreathing: /respir|breath/i.test(reply),
      ...(medium ? { crisisResources: safety.crisisResources } : {}),
    };
  }
}
