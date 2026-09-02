import { Test } from '@nestjs/testing';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TodoPriority } from './todo.constants';

const view = {
  id: '507f1f77bcf86cd799439011',
  title: 'Pack the yellow rain jacket',
  description: '',
  completed: false,
  priority: TodoPriority.LOW,
  tags: ['packing'],
  dueAt: null,
  createdAt: '2026-09-01T08:00:00.000Z',
  updatedAt: '2026-09-01T08:00:00.000Z',
};

describe('TodosController', () => {
  let controller: TodosController;
  const todos = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [{ provide: TodosService, useValue: todos }],
    }).compile();

    controller = module.get(TodosController);
  });

  it('create delegates to the service', async () => {
    todos.create.mockResolvedValue(view);
    await expect(controller.create({ title: view.title })).resolves.toEqual(
      view,
    );
    expect(todos.create).toHaveBeenCalledWith({ title: view.title });
  });

  it('findAll forwards query params', async () => {
    todos.findAll.mockResolvedValue([view]);
    const query = { q: 'jacket', status: 'open' as const };
    await expect(controller.findAll(query)).resolves.toEqual([view]);
    expect(todos.findAll).toHaveBeenCalledWith(query);
  });

  it('findOne looks up by id', async () => {
    todos.findOne.mockResolvedValue(view);
    await expect(controller.findOne(view.id)).resolves.toEqual(view);
  });

  it('patch and put both call update', async () => {
    todos.update.mockResolvedValue({ ...view, completed: true });
    await controller.update(view.id, { completed: true });
    await controller.replace(view.id, { completed: true });
    expect(todos.update).toHaveBeenCalledTimes(2);
  });

  it('remove returns the service promise (204 is set on the method)', async () => {
    todos.remove.mockResolvedValue(undefined);
    await expect(controller.remove(view.id)).resolves.toBeUndefined();
  });
});
