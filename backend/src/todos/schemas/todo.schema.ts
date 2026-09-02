import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TodoPriority } from '../todo.constants';

export type TodoDocument = HydratedDocument<Todo>;

@Schema({ timestamps: true, collection: 'todos' })
export class Todo {
  @Prop({ required: true, trim: true, maxlength: 180 })
  title: string;

  @Prop({ default: '', maxlength: 2000 })
  description: string;

  @Prop({ default: false, index: true })
  completed: boolean;

  @Prop({
    type: String,
    enum: TodoPriority,
    default: TodoPriority.MEDIUM,
  })
  priority: TodoPriority;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Date, default: null })
  dueAt: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TodoSchema = SchemaFactory.createForClass(Todo);

TodoSchema.index({ completed: 1, createdAt: -1 });
