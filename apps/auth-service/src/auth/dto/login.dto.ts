import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        description: 'Username or email address',
        example: 'admin@test.com',
    })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        description: 'User password',
        example: 'SecretPassword123!',
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        description: 'Optional device information',
        example: 'Chrome/Mac',
        required: false,
    })
    deviceInfo?: string;
}
