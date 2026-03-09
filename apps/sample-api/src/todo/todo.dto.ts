import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTodoDto {
  @ApiProperty({
    description: 'The name/title of the todo item',
    example: 'Buy groceries',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class UpdateTodoDto {
  @ApiProperty({
    description: 'Updated name/title of the todo item',
    example: 'Buy organic groceries',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}
