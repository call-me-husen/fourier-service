import { Entity, Unique, ManyToOne, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';

@Entity('attendances')
@Unique(['employee', 'date'])
export class Attendance extends BaseEntity {
  @ManyToOne(() => Employee)
  employee: Employee;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'clock_in',
  })
  clockIn: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'clock_out',
  })
  clockOut: Date;
}
