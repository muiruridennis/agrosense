import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  farmId!: string | null;

  @ManyToOne(() => Farm, (farm) => farm.reports, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'farmId' })
  farm!: Farm | null;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'timestamp', nullable: true })
  rangeStart!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  rangeEnd!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  generatedAt!: Date | null;

  @Column({ type: 'json', nullable: true })
  metrics!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
