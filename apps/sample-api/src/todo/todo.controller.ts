import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TodoService } from './todo.service';
import { CreateTodoDto, UpdateTodoDto } from './todo.dto';

@ApiTags('Todos')
@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) { }

  @Get()
  @ApiOperation({ summary: 'Get all todo items' })
  @ApiResponse({ status: 200, description: 'List of todos retrieved' })
  findAll() {
    return this.todoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get todo item by ID' })
  @ApiParam({ name: 'id', description: 'Internal ID of the todo' })
  @ApiResponse({ status: 200, description: 'Todo found' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  findById(@Param('id') id: string) {
    return this.todoService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new todo item' })
  @ApiResponse({ status: 201, description: 'Todo created successfully' })
  create(@Body() dto: CreateTodoDto) {
    return this.todoService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a todo item' })
  @ApiParam({ name: 'id', description: 'Internal ID of the todo' })
  @ApiResponse({ status: 200, description: 'Todo updated successfully' })
  update(@Param('id') id: string, @Body() dto: UpdateTodoDto) {
    return this.todoService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a todo item' })
  @ApiParam({ name: 'id', description: 'Internal ID of the todo' })
  @ApiResponse({ status: 200, description: 'Todo deleted successfully' })
  delete(@Param('id') id: string) {
    return this.todoService.delete(id);
  }
}
