import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AbilityFactory,
  Action,
  AppAbility,
  AuthUser,
} from './ability.factory';

/**
 * Metadata interface cho @CheckAbilities() decorator
 */
export interface AbilityRequirement {
  action: Action;
  subject: string;
}

export const CHECK_ABILITIES_KEY = 'check_abilities';

/**
 * Decorator: @CheckAbilities({ action: Action.Read, subject: 'User' })
 */
export const CheckAbilities = (...requirements: AbilityRequirement[]) =>
  SetMetadata(CHECK_ABILITIES_KEY, requirements);

/**
 * Guard: Kiểm tra quyền dựa trên CASL abilities
 */
@Injectable()
export class AbilitiesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requirements =
      this.reflector.get<AbilityRequirement[]>(
        CHECK_ABILITIES_KEY,
        context.getHandler(),
      ) || [];

    if (requirements.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const ability: AppAbility = this.abilityFactory.createForUser(user);

    for (const req of requirements) {
      if (!ability.can(req.action, req.subject)) {
        throw new ForbiddenException(
          `Insufficient permissions: cannot ${req.action} ${req.subject}`,
        );
      }
    }

    return true;
  }
}
