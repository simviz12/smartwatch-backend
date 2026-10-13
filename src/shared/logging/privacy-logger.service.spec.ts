import { PrivacyLogger } from './privacy-logger.service';

describe('PrivacyLogger (Privacy & Health)', () => {
  let logger: PrivacyLogger;

  beforeEach(() => {
    logger = new PrivacyLogger();
  });

  it('MUST NOT include message content, chat text, prompts, tokens or passwords in sanitized output', () => {
    const sensitivePayload = {
      id: 'usr_123',
      chatId: 'chat_999',
      riskLevel: 'high',
      count: 4,
      body: 'I am feeling overwhelmed and need help right now',
      message: 'Can you help me?',
      text: 'Confidential thoughts here',
      token: 'jwt_secret_token_12345',
      authorization: 'Bearer secret_token',
      password: 'mypassword123',
    };

    const sanitized = logger.sanitize(sensitivePayload) as Record<
      string,
      unknown
    >;

    // Allowed fields
    expect(sanitized.id).toBe('usr_123');
    expect(sanitized.chatId).toBe('chat_999');
    expect(sanitized.riskLevel).toBe('high');
    expect(sanitized.count).toBe(4);

    // Forbidden fields MUST be dropped completely
    expect(sanitized.body).toBeUndefined();
    expect(sanitized.message).toBeUndefined();
    expect(sanitized.text).toBeUndefined();
    expect(sanitized.token).toBeUndefined();
    expect(sanitized.authorization).toBeUndefined();
    expect(sanitized.password).toBeUndefined();
  });

  it('MUST NOT include message content in logged strings', () => {
    const rawSensitiveData = {
      userId: '123',
      text: 'I am thinking about self-harm',
      content: 'Private user message',
      secretToken: 'abc123secret',
    };

    logger.log('Incoming user interaction', rawSensitiveData);

    const logHistory = logger.lastLoggedMessages.join(' ');
    expect(logHistory).not.toContain('I am thinking about self-harm');
    expect(logHistory).not.toContain('Private user message');
    expect(logHistory).not.toContain('abc123secret');
    expect(logHistory).toContain('userId');
  });
});
