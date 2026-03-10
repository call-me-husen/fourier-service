import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('job_positions')
export class JobPosition extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;
}
