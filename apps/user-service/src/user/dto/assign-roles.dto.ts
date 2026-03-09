import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsArray,
  IsUUID,
} from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    description: 'Array of valid UUID role IDs to assign to the user',
    example: ['d290f1ee-6c54-4b01-90e6-d701748f0851'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  roleIds: string[];
}
