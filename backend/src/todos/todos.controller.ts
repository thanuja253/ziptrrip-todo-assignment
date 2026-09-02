import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { ListTodosQuery } from './dto/list-todos.query';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodosService } from './todos.service';

@Controller('todos')
export class TodosController {
  constructor(private readonly todos: TodosService) {}

  @Post()
  create(@Body() dto: CreateTodoDto) {
    return this.todos.create(dto);
  }

  @Get()
  findAll(@Query() query: ListTodosQuery) {
    return this.todos.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todos.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTodoDto) {
    return this.todos.update(id, dto);
  }

  // Assignment sample used PUT; keep it as an alias of the partial update.
  @Put(':id')
  replace(@Param('id') id: string, @Body() dto: UpdateTodoDto) {
    return this.todos.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.todos.remove(id);
  }
}
