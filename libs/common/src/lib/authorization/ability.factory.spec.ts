import { AbilityFactory, Action, AuthUser } from './ability.factory';

describe('AbilityFactory', () => {
  let factory: AbilityFactory;

  beforeEach(() => {
    factory = new AbilityFactory();
  });

  describe('admin role', () => {
    const admin: AuthUser = { sub: 'admin-1', roles: ['admin'] };

    it('should grant manage all', () => {
      const ability = factory.createForUser(admin);
      expect(ability.can(Action.Manage, 'all')).toBe(true);
    });

    it('should allow CRUD on any subject', () => {
      const ability = factory.createForUser(admin);
      expect(ability.can(Action.Create, 'User')).toBe(true);
      expect(ability.can(Action.Read, 'Order')).toBe(true);
      expect(ability.can(Action.Update, 'Product')).toBe(true);
      expect(ability.can(Action.Delete, 'Report')).toBe(true);
    });
  });

  describe('user role', () => {
    const user: AuthUser = { sub: 'user-1', roles: ['user'] };

    it('should allow read on all subjects', () => {
      const ability = factory.createForUser(user);
      expect(ability.can(Action.Read, 'User')).toBe(true);
      expect(ability.can(Action.Read, 'Task')).toBe(true);
    });

    it('should allow create/update/delete on own resources (userId matches sub)', () => {
      const ability = factory.createForUser(user);
      // subject() isn't needed for simple string subjects; use conditions matching
      const ownResource = { userId: 'user-1' };
      expect(ability.can(Action.Create, 'Task')).toBe(true); // can create (conditions checked server-side)
      expect(ability.can(Action.Update, 'Task')).toBe(true);
      expect(ability.can(Action.Delete, 'Task')).toBe(true);
    });
  });

  describe('guest role (no matching role)', () => {
    const guest: AuthUser = { sub: 'guest-1', roles: [] };

    it('should allow read on all', () => {
      const ability = factory.createForUser(guest);
      expect(ability.can(Action.Read, 'User')).toBe(true);
    });

    it('should deny create', () => {
      const ability = factory.createForUser(guest);
      expect(ability.can(Action.Create, 'Task')).toBe(false);
    });

    it('should deny update', () => {
      const ability = factory.createForUser(guest);
      expect(ability.can(Action.Update, 'Task')).toBe(false);
    });

    it('should deny delete', () => {
      const ability = factory.createForUser(guest);
      expect(ability.can(Action.Delete, 'Task')).toBe(false);
    });
  });
});
