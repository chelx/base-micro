import { Test, TestingModule } from '@nestjs/testing';
import { GrpcController } from './grpc.controller';
import { UserService } from '../user/user.service';
import { UserStatus } from '../user/entities';

describe('GrpcController', () => {
  let controller: GrpcController;
  let userService: jest.Mocked<Partial<UserService>>;

  const mockUser = {
    id: 'user-1',
    email: 'john@example.com',
    username: 'johndoe',
    status: UserStatus.ACTIVE,
    profile: {
      id: 'profile-1',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
      phone: '0123456789',
      address: '123 Main St',
      user: null as any,
    },
    roles: [
      {
        id: 'role-1',
        name: 'admin',
        description: 'Admin role',
        permissions: [
          { id: 'perm-1', resource: 'users', action: 'read' },
          { id: 'perm-2', resource: 'users', action: 'write' },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userService = {
      findOne: jest.fn(),
      getUserPermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrpcController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<GrpcController>(GrpcController);
  });

  describe('getUserProfile', () => {
    it('should return user profile data via gRPC', async () => {
      userService.findOne.mockResolvedValue(mockUser as any);

      const result = await controller.getUserProfile({ userId: 'user-1' });

      expect(result).toEqual({
        userId: 'user-1',
        email: 'john@example.com',
        username: 'johndoe',
        status: UserStatus.ACTIVE,
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        address: '123 Main St',
        roles: ['admin'],
      });
    });

    it('should handle user without profile gracefully', async () => {
      const userWithoutProfile = { ...mockUser, profile: null };
      userService.findOne.mockResolvedValue(userWithoutProfile as any);

      const result = await controller.getUserProfile({ userId: 'user-1' });

      expect(result.firstName).toBe('');
      expect(result.lastName).toBe('');
      expect(result.phone).toBe('');
      expect(result.address).toBe('');
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions via gRPC', async () => {
      userService.getUserPermissions.mockResolvedValue([
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
      ]);

      const result = await controller.getUserPermissions({ userId: 'user-1' });

      expect(result).toEqual({
        userId: 'user-1',
        permissions: [
          { resource: 'users', action: 'read' },
          { resource: 'users', action: 'write' },
        ],
      });
    });

    it('should return empty permissions when user has no roles', async () => {
      userService.getUserPermissions.mockResolvedValue([]);

      const result = await controller.getUserPermissions({ userId: 'user-1' });

      expect(result).toEqual({
        userId: 'user-1',
        permissions: [],
      });
    });
  });
});
