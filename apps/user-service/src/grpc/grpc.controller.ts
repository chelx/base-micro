import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from '../user/user.service';

interface UserIdRequest {
  userId: string;
}

interface VerifyCredentialsRequest {
  usernameOrEmail: string;
  password: string;
}

interface VerifyCredentialsResponse {
  success: boolean;
  userId: string;
  email: string;
  roles: string[];
}

interface UserProfileResponse {
  userId: string;
  email: string;
  username: string;
  status: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  roles: string[];
}

interface PermissionItem {
  resource: string;
  action: string;
}

interface UserPermissionsResponse {
  userId: string;
  permissions: PermissionItem[];
}

@Controller()
export class GrpcController {
  constructor(private readonly userService: UserService) { }

  @GrpcMethod('UserService', 'GetUserProfile')
  async getUserProfile(data: UserIdRequest): Promise<UserProfileResponse> {
    const user = await this.userService.findOne(data.userId);
    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      status: user.status,
      firstName: user.profile?.firstName ?? '',
      lastName: user.profile?.lastName ?? '',
      phone: user.profile?.phone ?? '',
      address: user.profile?.address ?? '',
      roles: user.roles?.map((r) => r.name) ?? [],
    };
  }

  @GrpcMethod('UserService', 'GetUserPermissions')
  async getUserPermissions(
    data: UserIdRequest,
  ): Promise<UserPermissionsResponse> {
    const permissions = await this.userService.getUserPermissions(data.userId);
    return {
      userId: data.userId,
      permissions,
    };
  }

  @GrpcMethod('UserService', 'VerifyCredentials')
  async verifyCredentials(
    data: VerifyCredentialsRequest,
  ): Promise<VerifyCredentialsResponse> {
    const user = await this.userService.verifyCredentials(
      data.usernameOrEmail,
      data.password,
    );
    return {
      success: !!user,
      userId: user?.id ?? '',
      email: user?.email ?? '',
      roles: user?.roles?.map((r) => r.name) ?? [],
    };
  }
}
