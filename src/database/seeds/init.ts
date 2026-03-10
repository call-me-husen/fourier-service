import { AppDataSource } from '../data-source';
import { seedAttendances } from './attendance.seed';
import { seedDepartments } from './departments.seed';
import { seedEmployees } from './employees.seed';
import { seedHolidays } from './holidays.seed';
import { seedJobPositions } from './job-positions.seed';
import { seedRoles } from './roles.seed';

async function runSeeds() {
  await AppDataSource.initialize();

  console.log('🌱 Running seeds...');

  await seedRoles();
  await seedDepartments();
  await seedJobPositions();
  await seedHolidays();
  await seedEmployees();
  await seedAttendances();

  console.log('✅ Seeding completed');

  process.exit(0);
}

void runSeeds();
