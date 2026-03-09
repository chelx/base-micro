import { DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Profile } from '../user/entities/profile.entity';
import { Role } from '../user/entities/role.entity';
import { Permission } from '../user/entities/permission.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'user_service_db',
    entities: [User, Profile, Role, Permission],
    migrations: [join(__dirname, 'migrations/*.ts')],
    synchronize: false,
    logging: true,
});
