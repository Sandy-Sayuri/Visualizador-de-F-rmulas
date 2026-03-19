import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.factory';

describe('Simulations API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates, lists, retrieves and deletes a simulation', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/simulations')
      .send({
        name: 'Solar Playground',
        description: 'e2e flow',
        bodies: [
          {
            name: 'Star',
            mass: 1000,
            radius: 100,
            color: 'yellow',
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
          },
        ],
      })
      .expect(201);

    expect(createResponse.body.id).toBeDefined();
    expect(createResponse.body.name).toBe('Solar Playground');
    expect(createResponse.body.bodies).toHaveLength(1);

    const simulationId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/simulations')
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(simulationId);

    await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(simulationId);
        expect(body.description).toBe('e2e flow');
      });

    await request(app.getHttpServer())
      .delete(`/api/simulations/${simulationId}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .expect(404);
  });

  it('returns validation errors for invalid payloads', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/simulations')
      .send({
        name: '',
        bodies: [
          {
            name: '',
            mass: -1,
            radius: 0,
            color: '',
            position: { x: 'invalid', y: 0 },
            velocity: { x: 0, y: 0 },
          },
        ],
      })
      .expect(400);

    expect(response.body.message).toBeInstanceOf(Array);
  });
});
