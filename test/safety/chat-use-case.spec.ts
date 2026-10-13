import { Test, TestingModule } from '@nestjs/testing';
import { SendChatMessageUseCase, FIXED_HIGH_RISK_RESPONSE } from '../../src/modules/chat/application/send-chat-message.use-case';
import { LLM_PORT } from '../../src/modules/chat/application/llm.port';
import { MockLlmAdapter } from '../../src/modules/chat/infrastructure/mock-llm.adapter';
import { ChatMessage, RiskLevel } from '../../src/modules/chat/domain/chat.entity';
import { lastValueFrom, toArray } from 'rxjs';

describe('SendChatMessageUseCase Safety & LLM Gate', () => {
  let useCase: SendChatMessageUseCase;
  let mockLlm: MockLlmAdapter;

  beforeEach(async () => {
    mockLlm = new MockLlmAdapter();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendChatMessageUseCase,
        {
          provide: LLM_PORT,
          useValue: mockLlm,
        },
      ],
    }).compile();

    useCase = module.get<SendChatMessageUseCase>(SendChatMessageUseCase);
  });

  it('should NEVER invoke the LLM model on HIGH risk input and return fixed crisis response', async () => {
    const highRiskMessages: ChatMessage[] = [
      { role: 'user', content: 'Quiero quitarme la vida hoy' },
    ];

    const stream$ = useCase.execute(highRiskMessages);
    const chunks = await lastValueFrom(stream$.pipe(toArray()));

    // Model must NEVER be called
    expect(mockLlm.callCount).toBe(0);

    // Must emit safety chunk with HIGH risk and resources
    const safetyChunk = chunks.find((c) => c.type === 'safety');
    expect(safetyChunk).toBeDefined();
    expect(safetyChunk?.riskLevel).toBe(RiskLevel.HIGH);
    expect(safetyChunk?.crisisResources?.length).toBeGreaterThan(0);

    // Must return fixed crisis response token
    const tokenChunk = chunks.find((c) => c.type === 'token');
    expect(tokenChunk?.token).toBe(FIXED_HIGH_RISK_RESPONSE);

    // Final chunk must be done
    expect(chunks[chunks.length - 1].type).toBe('done');
  });

  it('should emit safety event with resources and invoke LLM on MEDIUM risk input', async () => {
    const mediumRiskMessages: ChatMessage[] = [
      { role: 'user', content: 'No puedo más con esta presión' },
    ];

    const stream$ = useCase.execute(mediumRiskMessages);
    const chunks = await lastValueFrom(stream$.pipe(toArray()));

    // Model must be called
    expect(mockLlm.callCount).toBe(1);

    // Must emit safety chunk with MEDIUM risk
    const safetyChunk = chunks.find((c) => c.type === 'safety');
    expect(safetyChunk).toBeDefined();
    expect(safetyChunk?.riskLevel).toBe(RiskLevel.MEDIUM);
  });

  it('should stream tokens normally without safety warning on LOW risk input', async () => {
    const lowRiskMessages: ChatMessage[] = [
      { role: 'user', content: 'Me muero de sueño después de trabajar' },
    ];

    const stream$ = useCase.execute(lowRiskMessages);
    const chunks = await lastValueFrom(stream$.pipe(toArray()));

    expect(mockLlm.callCount).toBe(1);
    const safetyChunk = chunks.find((c) => c.type === 'safety');
    expect(safetyChunk).toBeUndefined();
    expect(chunks.some((c) => c.type === 'token')).toBe(true);
  });
});
