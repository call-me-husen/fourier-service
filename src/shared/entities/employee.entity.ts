import { Entity, Column, ManyToOne, Index, OneToOne } from 'typeorm';
import { Role } from './role.entity';
import { BaseEntity } from './base.entity';
import { Department } from './department.entity';
import { JobPosition } from './job-position.entity';
import { Contact } from './contact.entity';

@Entity('employees')
@Index(['firstName', 'lastName'])
export class Employee extends BaseEntity {
  @Column({ unique: true, name: 'employee_code' })
  employeeCode: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  photo: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({ nullable: true })
  surename: string;

  @ManyToOne(() => Role)
  role: Role;

  @ManyToOne(() => Department)
  department: Department;

  @ManyToOne(() => JobPosition)
  jobPosition: JobPosition;

  @OneToOne(() => Contact, (contact) => contact.employee, { nullable: true })
  contact: Contact;
}
