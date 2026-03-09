import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from './todo.entity';

@Injectable()
export class TodoRepository {
  constructor(
    @InjectRepository(Todo)
    private readonly repo: Repository<Todo>,
  ) {}

  async findAll(): Promise<Todo[]> {
    return this.repo.find();
  }

  async findById(id: string): Promise<Todo | null> {
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<Todo>): Promise<Todo> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Todo>): Promise<Todo | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
