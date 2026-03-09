import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface DatabaseConfigOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  entities?: any[];
  migrations?: any[];
  synchronize?: boolean; // WARNING: Use false in production
}

export const createTypeOrmConfig = (
  options: DatabaseConfigOptions,
): TypeOrmModuleOptions => {
  return {
    type: 'postgres', // Default standard, can be injected via env for multi-db support
    host: options.host || process.env['DB_HOST'] || 'localhost',
    port:
      options.port !== undefined
        ? options.port
        : parseInt(process.env['DB_PORT'] || '5432', 10),
    username: options.username || process.env['DB_USERNAME'] || 'postgres',
    password: options.password || process.env['DB_PASSWORD'] || 'postgres',
    database: options.database || process.env['DB_NAME'] || 'postgres',
    entities: options.entities || [],
    migrations: options.migrations || [],
    synchronize:
      options.synchronize !== undefined
        ? options.synchronize
        : process.env['NODE_ENV'] !== 'production',
    autoLoadEntities: true,
    logging: process.env['NODE_ENV'] !== 'production',
  };
};
