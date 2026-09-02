import { TodoPriority } from './todo.constants';

export type TodoView = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: TodoPriority;
  tags: string[];
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TodoRecord = {
  _id: unknown;
  title: string;
  description?: string;
  completed: boolean;
  priority: TodoPriority;
  tags?: string[];
  dueAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function toTodoView(doc: TodoRecord): TodoView {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description ?? '',
    completed: Boolean(doc.completed),
    priority: doc.priority,
    tags: doc.tags ?? [],
    dueAt: doc.dueAt ? new Date(doc.dueAt).toISOString() : null,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}
