import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from '../auth/auth.service';

interface TokenRequest {
  token: string;
}

interface TokenResponse {
  valid: boolean;
  sub: string;
  email: string;
  roles: string[];
}

@Controller()
export class GrpcController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(data: TokenRequest): Promise<TokenResponse> {
    const result = await this.authService.validateToken(data.token);
    return {
      valid: result.valid,
      sub: result.payload?.sub ?? '',
      email: result.payload?.email ?? '',
      roles: result.payload?.roles ?? [],
    };
  }
}
