import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Todo } from './schemas/todo.schema';
import { TodoPriority } from './todo.constants';
import { TodosService } from './todos.service';

const OID = '507f1f77bcf86cd799439011';

const sample = {
  _id: OID,
  title: 'Hold the Lisbon apartment deposit',
  description: 'Host wants the remainder by Friday.',
  completed: false,
  priority: TodoPriority.HIGH,
  tags: ['lisbon', 'money'],
  dueAt: new Date('2026-09-04T10:00:00.000Z'),
  createdAt: new Date('2026-09-01T08:00:00.000Z'),
  updatedAt: new Date('2026-09-01T08:00:00.000Z'),
};

function mockModel() {
  return {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    estimatedDocumentCount: jest.fn(),
    insertMany: jest.fn(),
  };
}

describe('TodosService', () => {
  let service: TodosService;
  let model: ReturnType<typeof mockModel>;

  beforeEach(async () => {
    model = mockModel();

    const module = await Test.createTestingModule({
      providers: [
        TodosService,
        { provide: getModelToken(Todo.name), useValue: model },
      ],
    }).compile();

    service = module.get(TodosService);
  });

  describe('create', () => {
    it('stores a trimmed title and defaults priority to medium', async () => {
      model.create.mockResolvedValue({
        ...sample,
        title: 'Book airport transfer',
        description: '',
        priority: TodoPriority.MEDIUM,
        tags: [],
        dueAt: null,
      });

      const view = await service.create({ title: '  Book airport transfer  ' });

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Book airport transfer',
          description: '',
          priority: TodoPriority.MEDIUM,
          completed: false,
          dueAt: null,
        }),
      );
      expect(view.id).toBe(OID);
      expect(view.title).toBe('Book airport transfer');
    });

    it('collapses tag casing and drops duplicates', async () => {
      model.create.mockResolvedValue({ ...sample, tags: ['lisbon', 'money'] });

      await service.create({
        title: 'Pay deposit',
        tags: ['Lisbon', 'lisbon', ' money '],
      });

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['lisbon', 'money'] }),
      );
    });
  });

  describe('findAll', () => {
    function stubFind(rows: unknown[]) {
      const exec = jest.fn().mockResolvedValue(rows);
      const lean = jest.fn().mockReturnValue({ exec });
      const sort = jest.fn().mockReturnValue({ lean });
      model.find.mockReturnValue({ sort });
      return { sort };
    }

    it('returns mapped rows, open first', async () => {
      stubFind([sample]);

      const rows = await service.findAll();

      expect(model.find).toHaveBeenCalledWith({});
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(OID);
      expect(rows[0].dueAt).toBe('2026-09-04T10:00:00.000Z');
    });

    it('filters by open / done and by priority', async () => {
      stubFind([]);

      await service.findAll({ status: 'open', priority: TodoPriority.HIGH });

      expect(model.find).toHaveBeenCalledWith({
        completed: false,
        priority: TodoPriority.HIGH,
      });
    });

    it('treats q as a case-insensitive search across title, body, tags', async () => {
      stubFind([]);

      await service.findAll({ q: 'sintra' });

      const filter = model.find.mock.calls[0][0];
      expect(filter.$or).toHaveLength(3);
      expect(filter.$or[0].title.test('Sintra trains')).toBe(true);
    });
  });

  describe('findOne', () => {
    it('rejects junk ids before hitting the database', async () => {
      await expect(service.findOne('not-an-id')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(model.findById).not.toHaveBeenCalled();
    });

    it('throws when the document is gone', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(OID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the mapped todo', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sample),
      });

      const view = await service.findOne(OID);
      expect(view.title).toBe(sample.title);
      expect(view.completed).toBe(false);
    });
  });

  describe('update', () => {
    it('writes only the fields that were sent', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sample),
      });
      model.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...sample, completed: true }),
      });

      const view = await service.update(OID, { completed: true });

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        OID,
        { completed: true },
        { new: true },
      );
      expect(view.completed).toBe(true);
    });

    it('clears dueAt when the client sends null', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sample),
      });
      model.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...sample, dueAt: null }),
      });

      await service.update(OID, { dueAt: null });

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        OID,
        { dueAt: null },
        { new: true },
      );
    });
  });

  describe('remove', () => {
    it('refuses to delete a missing todo', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(OID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(model.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('deletes after a successful lookup', async () => {
      model.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sample),
      });
      model.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(sample),
      });

      await service.remove(OID);
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(OID);
    });
  });
});
