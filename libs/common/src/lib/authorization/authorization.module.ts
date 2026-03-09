import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AbilityFactory } from './ability.factory';
import { AbilitiesGuard } from './abilities.guard';
import { PoliciesGuard } from './policies.guard';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET', 'dev-jwt-secret-change-me'),
                signOptions: {
                    expiresIn: config.get<string>('JWT_ACCESS_EXPIRES', '15m') as any,
                },
            }),
        }),
    ],
    providers: [AbilityFactory, AbilitiesGuard, PoliciesGuard, JwtStrategy, JwtAuthGuard],
    exports: [AbilityFactory, AbilitiesGuard, PoliciesGuard, JwtStrategy, JwtAuthGuard, PassportModule, JwtModule, ConfigModule],
})
export class AuthorizationModule { }
