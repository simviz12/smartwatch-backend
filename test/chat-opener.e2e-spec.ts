import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ChatController & Opener Validation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /chat/stream should return 400 when context.opener is true without stressEvent', async () => {
    await request(app.getHttpServer())
      .post('/chat/stream')
      .send({
        messages: [],
        context: { opener: true, stressEvent: false },
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('context.opener is only allowed when context.stressEvent is true');
      });
  });

  it('POST /chat/stream should return SSE 200 when opener=true and stressEvent=true', async () => {
    const res = await request(app.getHttpServer())
      .post('/chat/stream')
      .send({
        messages: [],
        context: { opener: true, stressEvent: true },
      })
      .expect(200)
      .expect('Content-Type', /text\/event-stream/);

    expect(res.text).toContain('data:');
  });
});
