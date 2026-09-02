import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { TodoPriority } from '../todo.constants';
import type { TodoStatusFilter } from '../todo.constants';

export class ListTodosQuery {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @IsIn(['open', 'done'])
  status?: TodoStatusFilter;

  @IsOptional()
  @IsEnum(TodoPriority)
  priority?: TodoPriority;
}
