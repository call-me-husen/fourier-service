import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('departments')
export class Department extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true, name: 'parent_id' })
  parentId: string | null;
}
