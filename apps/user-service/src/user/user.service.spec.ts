import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { User, UserStatus, Profile, Role, Permission } from './entities';
import { describe, it, expect, beforeEach } from '@jest/globals';


describe('UserService', () => {
  let service: UserService;
  let userRepo: jest.Mocked<Partial<Repository<User>>>;
  let profileRepo: jest.Mocked<Partial<Repository<Profile>>>;
  let roleRepo: jest.Mocked<Partial<Repository<Role>>>;

  const mockPermission: Permission = {
    id: 'perm-1',
    resource: 'users',
    action: 'read',
  };

  const mockRole: Role = {
    id: 'role-1',
    name: 'admin',
    description: 'Admin role',
    permissions: [mockPermission],
  };

  const mockProfile: Profile = {
    id: 'profile-1',
    firstName: 'John',
    lastName: 'Doe',
    avatar: null,
    phone: '0123456789',
    address: '123 Main St',
    user: null as any,
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'john@example.com',
    username: 'johndoe',
    status: UserStatus.ACTIVE,
    profile: mockProfile,
    roles: [mockRole],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    profileRepo = {
      create: jest.fn(),
    };

    roleRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Profile), useValue: profileRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('create', () => {
    it('should create a new user with profile', async () => {
      userRepo.findOne.mockResolvedValue(null);
      profileRepo.create.mockReturnValue(mockProfile);
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      const result = await service.create({
        email: 'john@example.com',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        address: '123 Main St',
      });

      expect(result).toEqual(mockUser);
      expect(profileRepo.create).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        address: '123 Main St',
      });
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email or username already exists', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      await expect(
        service.create({
          email: 'john@example.com',
          username: 'johndoe',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      userRepo.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toEqual([mockUser]);
      expect(userRepo.find).toHaveBeenCalledWith({
        relations: ['profile', 'roles', 'roles.permissions'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('john@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findByEmail('nope@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update user and profile fields', async () => {
      const updatedUser = { ...mockUser, email: 'new@example.com' };
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        profile: { ...mockProfile },
      });
      userRepo.save.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', {
        email: 'new@example.com',
        firstName: 'Jane',
      });

      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { email: 'new@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      userRepo.remove.mockResolvedValue(mockUser);

      await service.remove('user-1');

      expect(userRepo.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to a user', async () => {
      const role2: Role = {
        id: 'role-2',
        name: 'editor',
        description: 'Editor role',
        permissions: [],
      };

      userRepo.findOne.mockResolvedValue({ ...mockUser, roles: [] });
      roleRepo.find.mockResolvedValue([mockRole, role2]);
      userRepo.save.mockResolvedValue({
        ...mockUser,
        roles: [mockRole, role2],
      });

      const result = await service.assignRoles('user-1', {
        roleIds: ['role-1', 'role-2'],
      });

      expect(result.roles).toHaveLength(2);
    });

    it('should throw NotFoundException if some roles not found', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      roleRepo.find.mockResolvedValue([mockRole]); // Only 1 found out of 2

      await expect(
        service.assignRoles('user-1', {
          roleIds: ['role-1', 'nonexistent-role'],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserPermissions', () => {
    it('should return deduplicated permissions from all roles', async () => {
      const perm2: Permission = {
        id: 'perm-2',
        resource: 'users',
        action: 'write',
      };
      const role2: Role = {
        id: 'role-2',
        name: 'editor',
        description: 'Editor',
        permissions: [mockPermission, perm2], // shares perm-1 with role1
      };

      const userWithMultipleRoles = {
        ...mockUser,
        roles: [mockRole, role2],
      };
      userRepo.findOne.mockResolvedValue(userWithMultipleRoles);

      const result = await service.getUserPermissions('user-1');

      // Should deduplicate: users:read appears in both roles
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { resource: 'users', action: 'read' },
        { resource: 'users', action: 'write' },
      ]);
    });

    it('should return empty array if user has no roles', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, roles: [] });

      const result = await service.getUserPermissions('user-1');

      expect(result).toEqual([]);
    });
  });
});
