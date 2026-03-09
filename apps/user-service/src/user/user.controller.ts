import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, AssignRolesDto } from './dto';
import {
  PoliciesGuard,
  CheckPolicies,
  Action,
  AppAbility,
  AuditLogInterceptor,
  JwtAuthGuard,
  PageOptionsDto,
  PageDto,
  ApiPaginatedResponse,
} from 'common';
import { User } from './entities';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(JwtAuthGuard, PoliciesGuard)
@UseInterceptors(AuditLogInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, 'User'))
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiPaginatedResponse(User)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, 'User'))
  findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.userService.findAll(pageOptionsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, 'User'))
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, 'User'))
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Delete, 'User'))
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }

  @Post(':id/roles')
  @ApiOperation({ summary: 'Assign roles to user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Roles assigned successfully' })
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Update, 'User'))
  assignRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRolesDto,
  ) {
    return this.userService.assignRoles(id, dto);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get user permissions' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved' })
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, 'User'))
  getPermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getUserPermissions(id);
  }
}
