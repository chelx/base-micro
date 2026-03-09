import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '../../session/session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-jwt-secret-change-me'),
    });
  }

  async validate(payload: any) {
    // Check blacklist
    if (payload.jti) {
      const isBlacklisted = await this.sessionService.isTokenBlacklisted(
        payload.jti,
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
