import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository, In } from 'typeorm';
import { User, Profile, Role } from './entities';
import { CreateUserDto, UpdateUserDto, AssignRolesDto } from './dto';
import { PageOptionsDto, PageDto, PageMetaDto } from 'common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) { }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    const profile = this.profileRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      address: dto.address,
    });

    const user = this.userRepository.create({
      email: dto.email,
      username: dto.username,
      status: dto.status,
      password: dto.password ? await bcrypt.hash(dto.password, 10) : undefined,
      profile,
    });

    return this.userRepository.save(user);
  }

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<User>> {
    const [entities, itemCount] = await this.userRepository.findAndCount({
      relations: ['profile', 'roles', 'roles.permissions'],
      order: { createdAt: pageOptionsDto.order },
      skip: pageOptionsDto.skip,
      take: pageOptionsDto.take,
    });

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'roles', 'roles.permissions'],
    });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['profile', 'roles', 'roles.permissions'],
    });
    if (!user) {
      throw new NotFoundException(`User with email "${email}" not found`);
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Update user fields
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.username !== undefined) user.username = dto.username;
    if (dto.status !== undefined) user.status = dto.status;

    // Update profile fields
    if (user.profile) {
      if (dto.firstName !== undefined) user.profile.firstName = dto.firstName;
      if (dto.lastName !== undefined) user.profile.lastName = dto.lastName;
      if (dto.phone !== undefined) user.profile.phone = dto.phone;
      if (dto.address !== undefined) user.profile.address = dto.address;
    }

    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async assignRoles(userId: string, dto: AssignRolesDto): Promise<User> {
    const user = await this.findOne(userId);
    const roles = await this.roleRepository.find({
      where: { id: In(dto.roleIds) },
    });

    if (roles.length !== dto.roleIds.length) {
      throw new NotFoundException('One or more roles not found');
    }

    user.roles = roles;
    return this.userRepository.save(user);
  }

  async getUserPermissions(
    userId: string,
  ): Promise<{ resource: string; action: string }[]> {
    const user = await this.findOne(userId);
    const permissions: { resource: string; action: string }[] = [];
    const seen = new Set<string>();

    for (const role of user.roles) {
      for (const permission of role.permissions) {
        const key = `${permission.resource}:${permission.action}`;
        if (!seen.has(key)) {
          seen.add(key);
          permissions.push({
            resource: permission.resource,
            action: permission.action,
          });
        }
      }
    }

    return permissions;
  }

  async verifyCredentials(
    usernameOrEmail: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
      select: ['id', 'email', 'username', 'password', 'status'],
      relations: ['roles', 'roles.permissions'],
    });

    if (!user || !user.password) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }
}
