import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async processAuditEvent(data: any): Promise<void> {
    try {
      this.logger.log(
        `Processing audit event: ${data.action} ${data.entityName}`,
      );
      const auditLog = this.auditRepository.create({
        action: data.action,
        entityName: data.entityName,
        userId: data.userId,
        status: data.status,
        durationMs: data.durationMs,
        request: data.request,
        response: data.response,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      });
      await this.auditRepository.save(auditLog);
      this.logger.debug('Audit log successfully saved to database');
    } catch (error) {
      this.logger.error(
        `Error saving audit event: ${error.message}`,
        error.stack,
      );
    }
  }

  async getAuditLogs(
    userId?: string,
    entityName?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<[AuditLog[], number]> {
    const query = this.auditRepository.createQueryBuilder('log');

    if (userId) {
      query.andWhere('log.userId = :userId', { userId });
    }

    if (entityName) {
      query.andWhere('log.entityName = :entityName', { entityName });
    }

    query.orderBy('log.timestamp', 'DESC').take(limit).skip(offset);

    return query.getManyAndCount();
  }
}
