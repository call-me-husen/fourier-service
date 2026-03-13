import dayjs from 'dayjs';
import { Employee } from '../../shared/entities/employee.entity';
import { Role } from '../../shared/entities/role.entity';
import { AppDataSource } from '../data-source';
import bcrypt from 'bcryptjs';
import { Department } from '../../shared/entities/department.entity';
import { IsNull, Not } from 'typeorm';

const admins = [
  {
    employeeCode: 'EMP001',
    email: 'jhon.doe@example.com',
    password: 'password123',
    firstName: 'Jhon',
    lastName: 'Doe',
  },
  {
    employeeCode: 'EMP002',
    email: 'jane.doe@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Doe',
  },
];

const employees = [
  {
    employeeCode: 'EMP021',
    email: 'john.smith@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Smith',
  },
  {
    employeeCode: 'EMP022',
    email: 'jane.smith@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
  },
  {
    employeeCode: 'EMP003',
    email: 'michael.johnson@example.com',
    password: 'password123',
    firstName: 'Michael',
    lastName: 'Johnson',
  },
  {
    employeeCode: 'EMP004',
    email: 'emily.williams@example.com',
    password: 'password123',
    firstName: 'Emily',
    lastName: 'Williams',
  },
  {
    employeeCode: 'EMP005',
    email: 'daniel.brown@example.com',
    password: 'password123',
    firstName: 'Daniel',
    lastName: 'Brown',
  },
  {
    employeeCode: 'EMP006',
    email: 'olivia.jones@example.com',
    password: 'password123',
    firstName: 'Olivia',
    lastName: 'Jones',
  },
  {
    employeeCode: 'EMP007',
    email: 'william.garcia@example.com',
    password: 'password123',
    firstName: 'William',
    lastName: 'Garcia',
  },
  {
    employeeCode: 'EMP008',
    email: 'ava.miller@example.com',
    password: 'password123',
    firstName: 'Ava',
    lastName: 'Miller',
  },
  {
    employeeCode: 'EMP009',
    email: 'james.davis@example.com',
    password: 'password123',
    firstName: 'James',
    lastName: 'Davis',
  },
  {
    employeeCode: 'EMP010',
    email: 'sophia.rodriguez@example.com',
    password: 'password123',
    firstName: 'Sophia',
    lastName: 'Rodriguez',
  },
  {
    employeeCode: 'EMP011',
    email: 'benjamin.martinez@example.com',
    password: 'password123',
    firstName: 'Benjamin',
    lastName: 'Martinez',
  },
  {
    employeeCode: 'EMP012',
    email: 'isabella.hernandez@example.com',
    password: 'password123',
    firstName: 'Isabella',
    lastName: 'Hernandez',
  },
  {
    employeeCode: 'EMP013',
    email: 'lucas.lopez@example.com',
    password: 'password123',
    firstName: 'Lucas',
    lastName: 'Lopez',
  },
  {
    employeeCode: 'EMP014',
    email: 'mia.gonzalez@example.com',
    password: 'password123',
    firstName: 'Mia',
    lastName: 'Gonzalez',
  },
  {
    employeeCode: 'EMP015',
    email: 'henry.wilson@example.com',
    password: 'password123',
    firstName: 'Henry',
    lastName: 'Wilson',
  },
  {
    employeeCode: 'EMP016',
    email: 'charlotte.anderson@example.com',
    password: 'password123',
    firstName: 'Charlotte',
    lastName: 'Anderson',
  },
  {
    employeeCode: 'EMP017',
    email: 'alexander.thomas@example.com',
    password: 'password123',
    firstName: 'Alexander',
    lastName: 'Thomas',
  },
  {
    employeeCode: 'EMP018',
    email: 'amelia.taylor@example.com',
    password: 'password123',
    firstName: 'Amelia',
    lastName: 'Taylor',
  },
  {
    employeeCode: 'EMP019',
    email: 'ethan.moore@example.com',
    password: 'password123',
    firstName: 'Ethan',
    lastName: 'Moore',
  },
  {
    employeeCode: 'EMP020',
    email: 'harper.jackson@example.com',
    password: 'password123',
    firstName: 'Harper',
    lastName: 'Jackson',
  },
];

export async function seedEmployees() {
  const repo = AppDataSource.getRepository(Employee);
  const roleRepo = AppDataSource.getRepository(Role);
  const departmentRepo = AppDataSource.getRepository(Department);

  const adminRole = await roleRepo.findOne({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    console.error('Admin role not found. Please seed roles first.');
    return;
  }

  const adminDepartment = await departmentRepo.findOne({
    where: { name: 'Recruitment' },
  });

  if (!adminDepartment) {
    console.error('Admin department not found. Please seed departments first.');
    return;
  }

  for (const admin of admins) {
    const exists = await repo.findOne({
      where: { email: admin.email },
    });

    if (!exists) {
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      // Randmoize date of birth for admins between 20 - 50 years old
      const age = Math.floor(Math.random() * 30) + 20;
      const dateOfBirth = dayjs().subtract(age, 'year').toDate();
      // Ranmize month and day of birth
      dateOfBirth.setMonth(Math.floor(Math.random() * 12));
      dateOfBirth.setDate(Math.floor(Math.random() * 28) + 1);
      await repo.save({
        ...admin,
        role: adminRole,
        password: hashedPassword,
        dateOfBirth,
        department: adminDepartment,
      });
    }
  }

  // All department except recruitment and parentId is not null
  const employeeDepartments = await departmentRepo.find({
    where: {
      name: Not('Recruitment'),
      parentId: Not(IsNull()),
    },
  });

  if (employeeDepartments.length === 0) {
    console.error(
      'No employee departments found. Please seed departments with sub-departments first.',
    );
    return;
  }

  const employeeRole = await roleRepo.findOne({
    where: { name: 'EMPLOYEE' },
  });

  if (!employeeRole) {
    console.error('Employee role not found. Please seed roles first.');
    return;
  }

  for (const emp of employees) {
    const exists = await repo.findOne({
      where: { email: emp.email },
    });

    if (!exists) {
      const hashedPassword = await bcrypt.hash(emp.password, 10);
      // Randmoize date of birth for admins between 20 - 50 years old
      const age = Math.floor(Math.random() * 30) + 20;
      const dateOfBirth = dayjs().subtract(age, 'year').toDate();
      // Ranmize month and day of birth
      dateOfBirth.setMonth(Math.floor(Math.random() * 12));
      dateOfBirth.setDate(Math.floor(Math.random() * 28) + 1);
      await repo.save({
        ...emp,
        role: employeeRole,
        password: hashedPassword,
        dateOfBirth,
        department:
          employeeDepartments[
            Math.floor(Math.random() * employeeDepartments.length)
          ],
      });
    }
  }

  console.log('✔ employees seeded');
}
