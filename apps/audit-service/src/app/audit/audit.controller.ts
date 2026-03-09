import {
  Controller,
  Get,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AbilitiesGuard, JwtAuthGuard } from 'common';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) { }

  @EventPattern('system.audit.log')
  async handleAuditLogEvent(@Payload() data: any) {
    await this.auditService.processAuditEvent(data);
  }

  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @Get()
  @ApiOperation({ summary: 'Get all audit logs with filtering' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'entityName', required: false, description: 'Filter by entity name (e.g. User)' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiResponse({ status: 200, description: 'List of audit logs retrieved' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('entityName') entityName?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    const [data, total] = await this.auditService.getAuditLogs(
      userId,
      entityName,
      limit,
      offset,
    );
    return {
      data,
      meta: {
        total,
        limit,
        offset,
      },
    };
  }
}
