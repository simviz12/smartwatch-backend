import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DATABASE_HEALTH_CHECKER } from '../src/modules/health/application/get-health.use-case';
import { DatabaseHealthCheckerPort } from '../src/modules/health/domain/health.entity';
import { GlobalExceptionFilter } from '../src/shared/errors/global-exception.filter';
import { PrivacyLogger } from '../src/shared/logging/privacy-logger.service';

describe('Health and Privacy (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let privacyLogger: PrivacyLogger;
  let mockDbChecker: DatabaseHealthCheckerPort;

  beforeAll(async () => {
    mockDbChecker = {
      check: jest.fn().mockResolvedValue(true),
    };

    privacyLogger = new PrivacyLogger();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATABASE_HEALTH_CHECKER)
      .useValue(mockDbChecker)
      .overrideProvider(PrivacyLogger)
      .useValue(privacyLogger)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(privacyLogger);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health → 200 with database "up" when database is reachable', async () => {
    jest.spyOn(mockDbChecker, 'check').mockResolvedValueOnce(true);

    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'pulso-api',
      version: expect.any(String),
      database: 'up',
      time: expect.any(String),
    });
  });

  it('GET /health → 200 with database "down" when database query fails', async () => {
    jest.spyOn(mockDbChecker, 'check').mockResolvedValueOnce(false);

    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'degraded',
      service: 'pulso-api',
      version: expect.any(String),
      database: 'down',
      time: expect.any(String),
    });
  });

  it('Privacy Test: A message body sent in a request NEVER appears in logs', async () => {
    const confidentialBody = {
      message: 'This is my confidential therapy notes: I am feeling anxious',
      secretToken: 'super-sensitive-token-999',
    };

    // Sending request with body to /health (or any endpoint)
    await request(app.getHttpServer())
      .post('/health')
      .send(confidentialBody)
      .expect(404); // Expect 404 since POST /health is not defined

    const loggedHistory = privacyLogger.lastLoggedMessages.join(' ');

    expect(loggedHistory).not.toContain(confidentialBody.message);
    expect(loggedHistory).not.toContain(confidentialBody.secretToken);
    expect(loggedHistory).not.toContain('confidential therapy notes');
  });
});
