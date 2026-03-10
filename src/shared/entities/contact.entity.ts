import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';

@Entity('contacts')
export class Contact extends BaseEntity {
  @OneToOne(() => Employee, (employee) => employee.contact, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true, name: 'emergency_contact' })
  emergencyContact: string;

  @Column({ nullable: true, name: 'emergency_phone' })
  emergencyPhone: string;
}
