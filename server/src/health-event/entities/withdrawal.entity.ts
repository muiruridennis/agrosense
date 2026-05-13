import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { HealthEvent } from './health-event.entity';
import { WithdrawalType } from '../enums/withdrawal-type.enum';
 
@Entity('withdrawals')
@Index('idx_withdrawal_health_event', ['healthEventId'])
@Index('idx_withdrawal_dates', ['startsAt', 'endsAt'])
export class Withdrawal extends BaseEntity {
  @Column({ type: 'uuid' })
  healthEventId!: string;
 
  @ManyToOne(() => HealthEvent, (event) => event.withdrawals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'healthEventId' })
  healthEvent!: HealthEvent;
 
  @Column({ type: 'enum', enum: WithdrawalType })
  productType!: WithdrawalType;
 
  @Column({ type: 'date' })
  startsAt!: Date;
 
  @Column({ type: 'date' })
  endsAt!: Date;
 
  @Column({ type: 'varchar', length: 255 })
  reason!: string;
 
  @Column({ type: 'float', nullable: true })
  estimatedLossQuantity!: number | null; // Liters, eggs count, kg
 
  @Column({ type: 'float', nullable: true })
  estimatedLossValue!: number | null; // KES
 
  @Column({ type: 'boolean', default: false })
  isCompleted!: boolean;
 
  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;
 
  // Helper method
  isActive(): boolean {
    const now = new Date();
    return new Date(this.startsAt) <= now && now <= new Date(this.endsAt);
  }
 
  getDaysRemaining(): number {
    const now = new Date();
    const end = new Date(this.endsAt);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
 