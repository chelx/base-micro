import { Injectable, NotFoundException } from '@nestjs/common';
import { TodoRepository } from './todo.repository';
import { CreateTodoDto, UpdateTodoDto } from './todo.dto';
import { Todo } from './todo.entity';

@Injectable()
export class TodoService {
  constructor(private readonly todoRepository: TodoRepository) {}

  async findAll(): Promise<Todo[]> {
    return this.todoRepository.findAll();
  }

  async findById(id: string): Promise<Todo> {
    const entity = await this.todoRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Todo with id "${id}" not found`);
    }
    return entity;
  }

  async create(dto: CreateTodoDto): Promise<Todo> {
    return this.todoRepository.create(dto);
  }

  async update(id: string, dto: UpdateTodoDto): Promise<Todo> {
    const entity = await this.todoRepository.update(id, dto);
    if (!entity) {
      throw new NotFoundException(`Todo with id "${id}" not found`);
    }
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    return this.todoRepository.delete(id);
  }
}
