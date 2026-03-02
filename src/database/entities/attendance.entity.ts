import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Employee } from './employee.entity';

@Entity('attendances')
@Unique('unique_employee_date', ['employeeId', 'date'])
@Index('idx_employee_id', ['employeeId'])
@Index('idx_date', ['date'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => Employee, (employee) => employee.attendances)
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ name: 'clock_in', type: 'timestamptz', nullable: true })
  clockIn!: Date | null;

  @Column({ name: 'clock_out', type: 'timestamptz', nullable: true })
  clockOut!: Date | null;

  @Column({ type: 'int', name: 'total_work_time', default: 0 })
  totalWorkTime!: number; // in seconds

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
