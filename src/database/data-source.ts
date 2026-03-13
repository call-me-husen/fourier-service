import 'dotenv/config';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,

  // Exclude entity from '/database/entities' to prevent circular dependency issues
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: ['src/database/migrations/*.{ts,js}'],

  synchronize: false, // Disable auto-sync in production
});
