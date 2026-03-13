import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('holidays')
export class Holiday extends BaseEntity {
  @Column({ type: 'date', unique: true })
  date: string;

  @Column()
  name: string;
}
