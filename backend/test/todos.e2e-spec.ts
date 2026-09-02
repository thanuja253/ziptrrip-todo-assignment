import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { TodoPriority } from '../src/todos/todo.constants';
import { TodosController } from '../src/todos/todos.controller';
import { TodosService } from '../src/todos/todos.service';

const view = {
  id: '507f1f77bcf86cd799439011',
  title: 'Hold the Lisbon apartment deposit',
  description: 'Host wants the remainder by Friday.',
  completed: false,
  priority: TodoPriority.HIGH,
  tags: ['lisbon'],
  dueAt: '2026-09-04T10:00:00.000Z',
  createdAt: '2026-09-01T08:00:00.000Z',
  updatedAt: '2026-09-01T08:00:00.000Z',
};

describe('Todos HTTP', () => {
  let app: INestApplication<App>;
  const todos = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [{ provide: TodosService, useValue: todos }],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('POST /api/todos rejects an empty title', async () => {
    await request(app.getHttpServer())
      .post('/api/todos')
      .send({ title: '' })
      .expect(400);
    expect(todos.create).not.toHaveBeenCalled();
  });

  it('POST /api/todos creates when the body is valid', async () => {
    todos.create.mockResolvedValue(view);

    const res = await request(app.getHttpServer())
      .post('/api/todos')
      .send({ title: view.title, priority: 'high' })
      .expect(201);

    expect(res.body.id).toBe(view.id);
  });

  it('GET /api/todos returns the list', async () => {
    todos.findAll.mockResolvedValue([view]);

    const res = await request(app.getHttpServer())
      .get('/api/todos')
      .query({ status: 'open' })
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(todos.findAll).toHaveBeenCalled();
  });

  it('GET /api/todos/:id returns one', async () => {
    todos.findOne.mockResolvedValue(view);

    const res = await request(app.getHttpServer())
      .get(`/api/todos/${view.id}`)
      .expect(200);

    expect(res.body.title).toBe(view.title);
  });

  it('PATCH /api/todos/:id updates', async () => {
    todos.update.mockResolvedValue({ ...view, completed: true });

    const res = await request(app.getHttpServer())
      .patch(`/api/todos/${view.id}`)
      .send({ completed: true })
      .expect(200);

    expect(res.body.completed).toBe(true);
  });

  it('DELETE /api/todos/:id returns 204', async () => {
    todos.remove.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(`/api/todos/${view.id}`)
      .expect(204);
  });
});
