import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppAbility, AbilityFactory } from './ability.factory';
import {
    CHECK_POLICIES_KEY,
    PolicyHandlerCallback,
} from './check-policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private abilityFactory: AbilityFactory,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const policyHandlers =
            this.reflector.get<PolicyHandlerCallback[]>(
                CHECK_POLICIES_KEY,
                context.getHandler(),
            ) || [];

        // If no policies are set, let it through
        if (policyHandlers.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        // Assuming `user` is attached to request via JWT/Authentication middleware
        // Provide a fallback guest user if missing to safely evaluate abilities
        const user = request.user || { sub: 'guest', roles: [] };

        const ability = this.abilityFactory.createForUser(user);

        return policyHandlers.every((handler) => this.execPolicyHandler(handler, ability));
    }

    private execPolicyHandler(handler: PolicyHandlerCallback, ability: AppAbility) {
        if (typeof handler === 'function') {
            return handler(ability);
        }
        return false;
    }
}
