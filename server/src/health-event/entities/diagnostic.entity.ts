import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HealthEvent } from './health-event.entity';
import { DiagnosticType } from '../enums/diagnostic-type.enum';
 
@Entity('diagnostics')
@Index('idx_diagnostic_health_event', ['healthEventId'])
@Index('idx_diagnostic_type', ['type'])
export class Diagnostic extends BaseEntity {
  @Column({ type: 'uuid' })
  healthEventId!: string;
 
  @ManyToOne(() => HealthEvent, (event) => event.diagnostics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'healthEventId' })
  healthEvent!: HealthEvent;
 
  @Column({ type: 'enum', enum: DiagnosticType })
  type!: DiagnosticType;
 
  @Column({ type: 'date' })
  performedDate!: Date;
 
  @Column({ type: 'varchar', nullable: true })
  labName!: string | null;
 
  @Column({ type: 'varchar', nullable: true })
  sampleId!: string | null;
 
  @Column({ type: 'jsonb', nullable: true })
  results!: Record<string, any> | null; // Flexible for different test types
 
  @Column({ type: 'varchar', nullable: true })
  interpretation!: string | null;
 
  @Column({ type: 'float', nullable: true })
  cost!: number | null;
 
  @Column({ type: 'uuid', nullable: true })
  performedBy!: string | null;
 
  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}