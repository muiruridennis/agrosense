import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HealthEvent } from './health-event.entity';
 
@Entity('quarantines')
@Index('idx_quarantine_health_event', ['healthEventId'])
@Index('idx_quarantine_active', ['isActive', 'endsAt'])
export class Quarantine extends BaseEntity {
  @Column({ type: 'uuid' })
  healthEventId!: string;
 
  @ManyToOne(() => HealthEvent, (event) => event.quarantines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'healthEventId' })
  healthEvent!: HealthEvent;
 
  @Column({ type: 'varchar', length: 100 })
  zoneName!: string; // "House A", "Pasture 3", "Isolation Pen"
 
  @Column({ type: 'date' })
  startsAt!: Date;
 
  @Column({ type: 'date' })
  endsAt!: Date;
 
  @Column({ type: 'boolean', default: false })
  requiresPPE!: boolean;
 
  @Column({ type: 'boolean', default: false })
  requiresHandHygiene!: boolean;
 
  @Column({ type: 'text', nullable: true })
  cleaningProtocol!: string | null;
 
  @Column({ type: 'jsonb', nullable: true })
  restrictedActions!: string[] | null; // ["move", "breed", "sell"]
 
  @Column({ type: 'boolean', default: false })
  isActive!: boolean;
 
  @Column({ type: 'timestamptz', nullable: true })
  liftedAt!: Date | null;
 
  @Column({ type: 'text', nullable: true })
  notes!: string | null;
 
  // Helper methods
  canLift(): boolean {
    return new Date() >= new Date(this.endsAt);
  }
 
  getDaysRemaining(): number {
    const now = new Date();
    const end = new Date(this.endsAt);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
 
  isActionRestricted(action: string): boolean {
    if (!this.isActive) return false;
    if (!this.restrictedActions) return false;
    return this.restrictedActions.includes(action);
  }
}