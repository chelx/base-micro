import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  InferSubjects,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';

/**
 * Action types cho RBAC/ABAC
 */
export enum Action {
  Manage = 'manage', // wildcard — mọi action
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

/**
 * Interface cho user context khi kiểm tra quyền
 */
export interface AuthUser {
  sub: string;
  email?: string;
  roles: string[];
}

type Subjects = InferSubjects<string> | 'all';
export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class AbilityFactory {
  /**
   * Tạo ability instance dựa trên roles của user.
   * Các service khác override/extend rules tùy nghiệp vụ.
   */
  createForUser(user: AuthUser): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    const roles = user.roles || [];

    if (roles.includes('admin')) {
      // Admin: full access
      can(Action.Manage, 'all');
    } else if (roles.includes('user')) {
      // User: read all, manage own resources
      can(Action.Read, 'all');
      can([Action.Create, Action.Update, Action.Delete], 'all', {
        userId: user.sub,
      } as any);
    } else {
      // Guest: read only
      can(Action.Read, 'all');
      cannot(Action.Create, 'all');
      cannot(Action.Update, 'all');
      cannot(Action.Delete, 'all');
    }

    return build();
  }
}
