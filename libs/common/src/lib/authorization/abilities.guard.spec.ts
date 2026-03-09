import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AbilitiesGuard,
  CHECK_ABILITIES_KEY,
  AbilityRequirement,
} from './abilities.guard';
import { AbilityFactory, Action, AuthUser } from './ability.factory';

describe('AbilitiesGuard', () => {
  let guard: AbilitiesGuard;
  let reflector: jest.Mocked<Reflector>;
  let abilityFactory: AbilityFactory;

  const createMockContext = (
    user?: AuthUser,
    requirements?: AbilityRequirement[],
  ): ExecutionContext => {
    const handler = jest.fn();
    const request = { user };

    const context = {
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    if (requirements) {
      reflector.get.mockReturnValue(requirements);
    } else {
      reflector.get.mockReturnValue([]);
    }

    return context;
  };

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
    } as any;
    abilityFactory = new AbilityFactory();
    guard = new AbilitiesGuard(reflector, abilityFactory);
  });

  it('should allow access when no requirements set', () => {
    const context = createMockContext(undefined, []);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user is not present', () => {
    const context = createMockContext(undefined, [
      { action: Action.Read, subject: 'User' },
    ]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow admin to access any resource', () => {
    const admin: AuthUser = { sub: 'a1', roles: ['admin'] };
    const context = createMockContext(admin, [
      { action: Action.Delete, subject: 'User' },
    ]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow user to read resources', () => {
    const user: AuthUser = { sub: 'u1', roles: ['user'] };
    const context = createMockContext(user, [
      { action: Action.Read, subject: 'Task' },
    ]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny guest from creating resources', () => {
    const guest: AuthUser = { sub: 'g1', roles: [] };
    const context = createMockContext(guest, [
      { action: Action.Create, subject: 'Task' },
    ]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should check all requirements', () => {
    const user: AuthUser = { sub: 'u1', roles: ['user'] };
    const context = createMockContext(user, [
      { action: Action.Read, subject: 'Task' },
      { action: Action.Read, subject: 'User' },
    ]);
    expect(guard.canActivate(context)).toBe(true);
  });
});
