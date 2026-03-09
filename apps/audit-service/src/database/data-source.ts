import { DataSource } from 'typeorm';
import { AuditLog } from '../app/audit/audit.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'audit_db',
    entities: [AuditLog],
    migrations: [join(__dirname, 'migrations/*.ts')],
    synchronize: false,
    logging: true,
});
