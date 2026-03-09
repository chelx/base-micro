import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsEmail } from 'class-validator';
import { UserStatus } from '../entities';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Unique username',
    example: 'johndoe',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+84987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'User address',
    example: '123 Main St, Hanoi',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;
}
