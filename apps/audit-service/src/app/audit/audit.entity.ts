import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['entityName', 'userId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 100 })
  entityName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'int', default: 0 })
  durationMs: number;

  @Column({ type: 'jsonb', nullable: true })
  request: any;

  @Column({ type: 'jsonb', nullable: true })
  response: any;

  @CreateDateColumn()
  timestamp: Date;
}
