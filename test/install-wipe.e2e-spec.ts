import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('DELETE /v1/installs/me (e2e)', () => {
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

  it('DELETE /v1/installs/me should return 200 and confirmation message', async () => {
    await request(app.getHttpServer())
      .delete('/v1/installs/me')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.deletedAt).toBeDefined();
        expect(res.body.message).toContain('eliminados completamente');
      });
  });
});
