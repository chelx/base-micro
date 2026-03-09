import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { VneidService } from './vneid.service';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto, RefreshTokenDto, ValidateTokenDto } from './dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly vneidService: VneidService,
  ) { }

  /**
   * POST /api/auth/login → Đăng nhập bằng username/password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: LoginDto) {
    const tokens = await this.authService.login(body.username, body.password, body.deviceInfo);
    return {
      message: 'Login successful',
      data: tokens,
    };
  }

  /**
   * GET /api/auth/vneid/login → Redirect tới VNeID Login
   */
  @Get('vneid/login')
  @ApiOperation({ summary: 'Redirect to VNeID Login Page' })
  @ApiResponse({ status: 302, description: 'Redirecting...' })
  vneidLogin(@Res() res: any) {
    const state = uuidv4();
    const url = this.vneidService.getAuthorizationUrl(state);
    return res.redirect(url);
  }

  /**
   * GET /api/auth/vneid/callback → VNeID callback sau khi user đăng nhập
   */
  @Get('vneid/callback')
  @ApiOperation({ summary: 'VNeID login callback' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async vneidCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    const result = await this.authService.loginWithVneid(code);
    return {
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    };
  }

  /**
   * POST /api/auth/refresh → Rotate refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  async refresh(@Body() body: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(body.refreshToken);
    return {
      message: 'Tokens refreshed',
      data: tokens,
    };
  }

  /**
   * POST /api/auth/logout → Logout current device
   */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from current device' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(token);
    return { message: 'Logged out successfully' };
  }

  /**
   * POST /api/auth/logout-all → Logout all devices
   */
  @Post('logout-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from ALL devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices' })
  async logoutAll(@Req() req: any) {
    const count = await this.authService.logoutAll(req.user.sub);
    return { message: `Logged out from ${count} devices` };
  }

  /**
   * POST /api/auth/validate → Internal token validation
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate JWT token (Internal use)' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validate(@Body() body: ValidateTokenDto) {
    return this.authService.validateToken(body.token);
  }
}
