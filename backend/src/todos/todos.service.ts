import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { CreateTodoDto } from './dto/create-todo.dto';
import { ListTodosQuery } from './dto/list-todos.query';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo, TodoDocument } from './schemas/todo.schema';
import { TodoPriority } from './todo.constants';
import { TodoRecord, TodoView, toTodoView } from './todo.view';

@Injectable()
export class TodosService implements OnModuleInit {
  constructor(
    @InjectModel(Todo.name) private readonly todos: Model<TodoDocument>,
  ) {}

  async onModuleInit() {
    const n = await this.todos.estimatedDocumentCount();
    if (n === 0) {
      await this.todos.insertMany(STARTERS);
    }
  }

  async create(dto: CreateTodoDto): Promise<TodoView> {
    const created = await this.todos.create(this.toDoc(dto));
    return toTodoView(created as unknown as TodoRecord);
  }

  async findAll(query: ListTodosQuery = {}): Promise<TodoView[]> {
    const filter: FilterQuery<TodoDocument> = {};

    if (query.status === 'open') filter.completed = false;
    if (query.status === 'done') filter.completed = true;
    if (query.priority) filter.priority = query.priority;

    const q = query.q?.trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { tags: rx }];
    }

    const rows = await this.todos
      .find(filter)
      .sort({ completed: 1, createdAt: -1 })
      .lean()
      .exec();

    return rows.map((row) => toTodoView(row as TodoRecord));
  }

  async findOne(id: string): Promise<TodoView> {
    const doc = await this.requireDoc(id);
    return toTodoView(doc as unknown as TodoRecord);
  }

  async update(id: string, dto: UpdateTodoDto): Promise<TodoView> {
    await this.requireDoc(id);

    const patch: Record<string, unknown> = {};
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.description !== undefined)
      patch.description = dto.description.trim();
    if (dto.completed !== undefined) patch.completed = dto.completed;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.tags !== undefined) patch.tags = normaliseTags(dto.tags);
    if (dto.dueAt !== undefined) {
      patch.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    }

    const updated = await this.todos
      .findByIdAndUpdate(id, patch, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Todo disappeared before the write landed.');
    }

    return toTodoView(updated as unknown as TodoRecord);
  }

  async remove(id: string): Promise<void> {
    await this.requireDoc(id);
    await this.todos.findByIdAndDelete(id).exec();
  }

  private async requireDoc(id: string): Promise<TodoDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('That id is not a valid Mongo ObjectId.');
    }

    const doc = await this.todos.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`No todo with id ${id}.`);
    }
    return doc;
  }

  private toDoc(dto: CreateTodoDto) {
    return {
      title: dto.title.trim(),
      description: (dto.description ?? '').trim(),
      priority: dto.priority ?? TodoPriority.MEDIUM,
      tags: normaliseTags(dto.tags),
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      completed: false,
    };
  }
}

function normaliseTags(tags?: string[]): string[] {
  if (!tags?.length) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of tags) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length === 8) break;
  }

  return out;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Empty collections get a handful of travel-shaped rows so the UI isn't
// a blank page the first time someone boots the stack.
const STARTERS: Array<Record<string, unknown>> = [
  {
    title: 'Hold the Lisbon apartment deposit',
    description:
      'Host wants the remainder by Friday. Receipt is in the travel thread, not the bank app.',
    completed: false,
    priority: TodoPriority.HIGH,
    tags: ['lisbon', 'money'],
    dueAt: daysFromNow(2),
  },
  {
    title: 'Renew passport photos',
    description:
      'Need a 35×45 set. Chemist on Rue Cler does them while you wait.',
    completed: false,
    priority: TodoPriority.MEDIUM,
    tags: ['docs'],
    dueAt: daysFromNow(9),
  },
  {
    title: 'Ask Marta about the Sintra train times',
    description:
      'Last I checked they change after 18:00. Confirm before we book the palace slot.',
    completed: true,
    priority: TodoPriority.LOW,
    tags: ['sintra'],
    dueAt: null,
  },
  {
    title: 'Pack the yellow rain jacket',
    description: '',
    completed: false,
    priority: TodoPriority.LOW,
    tags: ['packing'],
    dueAt: daysFromNow(14),
  },
];

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(10, 0, 0, 0);
  return d;
}
