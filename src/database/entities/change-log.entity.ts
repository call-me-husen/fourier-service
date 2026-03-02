import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('change_logs')
export class ChangeLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  entity!: string;

  @Column({ type: 'varchar', length: 255 })
  action!: string;

  @Column({ type: 'jsonb', nullable: true })
  changes!: Record<string, any> | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp!: Date;
}
