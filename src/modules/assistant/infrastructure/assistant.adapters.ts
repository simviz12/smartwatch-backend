import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppError } from '../../../shared/errors/app.error';
import { AssistantLlmPort, AssistantTurn, RateLimiterPort } from '../application/ask-assistant.use-case';

/** Calls Google Gemini with the key stored on the server (never shipped in the app). */
@Injectable()
export class GeminiAssistantAdapter implements AssistantLlmPort {
  private readonly logger = new Logger('GeminiAssistant');
  private readonly apiKey = (process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || '').trim();
  private readonly model = process.env.GEMINI_MODEL || process.env.LLM_CHAT_MODEL || 'gemini-2.5-flash';

  get configured(): boolean {
    return this.apiKey.length > 0;
  }

  async reply(systemPrompt: string, history: AssistantTurn[], message: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    const contents = [
      ...history.map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.text.slice(0, 2000) }] })),
      { role: 'user', parts: [{ text: message.slice(0, 2000) }] },
    ];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          // Short, warm replies: no hidden reasoning tokens eating the output budget.
          generationConfig: { temperature: 0.7, maxOutputTokens: 800, thinkingConfig: { thinkingBudget: 0 } },
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        // Never log the key or user text; status is enough to diagnose.
        this.logger.warn(`Gemini HTTP ${res.status}`);
        throw new AppError('AI_UPSTREAM_ERROR', 'El asistente no pudo responder ahora. Inténtalo de nuevo.', HttpStatus.BAD_GATEWAY);
      }
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    } catch (e) {
      if (e instanceof AppError) throw e;
      this.logger.warn(`Gemini request failed: ${(e as Error).name}`);
      throw new AppError('AI_UPSTREAM_ERROR', 'El asistente no pudo responder ahora. Inténtalo de nuevo.', HttpStatus.BAD_GATEWAY);
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Simple per-user sliding window kept in memory (enough for a single free instance). */
@Injectable()
export class InMemoryRateLimiter implements RateLimiterPort {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit = 30,
    private readonly windowMs = 60 * 60 * 1000,
  ) {}

  tryConsume(userId: string): boolean {
    const now = Date.now();
    const recent = (this.hits.get(userId) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(userId, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(userId, recent);
    return true;
  }
}
