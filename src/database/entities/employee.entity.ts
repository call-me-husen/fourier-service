import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Department } from './department.entity';
import { JobPosition } from './job-position.entity';
import { Attendance } from './attendance.entity';
import { EmployeeContact } from './employee-contact.entity';

export enum AccountRole {
  STANDARD = 'standard',
  ADMIN = 'admin',
}

export enum EmploymentType {
  FULLTIME = 'fulltime',
  CONTRACTOR = 'contractor',
  INTERN = 'intern',
  PARTTIME = 'parttime',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  employeeNumber!: string;

  @Column({ type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ type: 'varchar', length: 255 })
  lastName!: string | null;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
  photoUrl!: string | null;

  @Column({
    type: 'enum',
    enum: AccountRole,
    default: AccountRole.STANDARD,
  })
  role!: AccountRole;

  @Column({
    name: 'employment_type',
    type: 'enum',
    enum: EmploymentType,
    default: EmploymentType.FULLTIME,
  })
  employmentType!: EmploymentType;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId!: string | null;

  @ManyToOne(() => Department, (department) => department.employees, {
    nullable: true,
  })
  @JoinColumn({ name: 'department_id' })
  department!: Department;

  @Column({ name: 'position_id', type: 'uuid', nullable: true })
  positionId!: string | null;

  @ManyToOne(() => JobPosition, (position) => position.employees, {
    nullable: true,
  })
  @JoinColumn({ name: 'position_id' })
  position!: JobPosition;

  @OneToMany(() => Attendance, (attendance) => attendance.employee)
  attendances!: Attendance[];

  @Column({ type: 'simple-enum', enum: ['male', 'female'] })
  gender!: 'male' | 'female';

  @Column({ type: 'date' })
  dateOfBirth!: Date;

  @OneToOne(() => EmployeeContact, (contact) => contact.employee)
  contact!: EmployeeContact;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
