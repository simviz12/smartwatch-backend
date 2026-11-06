import { AppError } from '../../../shared/errors/app.error';
import { RiskLevel } from '../../chat/domain/chat.entity';
import { InMemoryRateLimiter } from '../infrastructure/assistant.adapters';
import { AskAssistantUseCase, AssistantLlmPort } from './ask-assistant.use-case';

function fakeLlm(configured = true, text = 'Respiremos juntos: inhala 4 y exhala 6.'): AssistantLlmPort & { calls: number } {
  return {
    configured,
    calls: 0,
    async reply() {
      this.calls++;
      return text;
    },
  };
}

describe('AskAssistantUseCase', () => {
  it('answers with the model and flags breathing suggestions', async () => {
    const llm = fakeLlm();
    const uc = new AskAssistantUseCase(llm, new InMemoryRateLimiter(5, 60_000));
    const r = await uc.execute({ userId: 'u1', message: 'Estoy estresado por el trabajo' });
    expect(r.reply).toContain('Respiremos');
    expect(r.riskLevel).toBe(RiskLevel.LOW);
    expect(r.suggestsBreathing).toBe(true);
    expect(llm.calls).toBe(1);
  });

  it('never sends high-risk messages to the model', async () => {
    const llm = fakeLlm();
    const uc = new AskAssistantUseCase(llm, new InMemoryRateLimiter(5, 60_000));
    const r = await uc.execute({ userId: 'u1', message: 'ya no quiero vivir' });
    expect(r.riskLevel).toBe(RiskLevel.HIGH);
    expect(r.reply).toContain('106');
    expect(r.crisisResources?.length).toBeGreaterThan(0);
    expect(llm.calls).toBe(0);
  });

  it('fails clearly when the server has no AI key', async () => {
    const uc = new AskAssistantUseCase(fakeLlm(false), new InMemoryRateLimiter(5, 60_000));
    await expect(uc.execute({ userId: 'u1', message: 'hola' })).rejects.toMatchObject({ code: 'AI_NOT_CONFIGURED' });
  });

  it('rate-limits per user', async () => {
    const uc = new AskAssistantUseCase(fakeLlm(), new InMemoryRateLimiter(2, 60_000));
    await uc.execute({ userId: 'u1', message: 'a' });
    await uc.execute({ userId: 'u1', message: 'b' });
    await expect(uc.execute({ userId: 'u1', message: 'c' })).rejects.toBeInstanceOf(AppError);
    await expect(uc.execute({ userId: 'u2', message: 'd' })).resolves.toBeDefined();
  });
});
