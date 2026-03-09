import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateTokenDto {
    @ApiProperty({
        description: 'JWT access token to validate',
    })
    @IsString()
    @IsNotEmpty()
    token: string;
}
