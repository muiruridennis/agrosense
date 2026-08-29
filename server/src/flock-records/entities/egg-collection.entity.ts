import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity';
import { FlockRecord } from './flock-record.entity';

export const EGGS_PER_TRAY = 30;

@Entity('egg_collections')
export class EggCollection extends BaseEntity {
  // ─── RELATIONSHIP ──────────────────────────────────────────────────────

  @Column({ type: 'uuid', unique: true })
  flockRecordId!: string;

  @OneToOne(() => FlockRecord, (record) => record.eggCollection, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'flockRecordId' })
  flockRecord!: FlockRecord;

  // ─── COLLECTIONS ──────────────────────────────────────────────────────

  @Column({ type: 'int', default: 0 })
  morningEggs!: number;

  @Column({ type: 'int', default: 0 })
  afternoonEggs!: number;

  @Column({ type: 'int', default: 0 })
  eveningEggs!: number;

  // ─── DOMAIN HELPERS ───────────────────────────────────────────────────

  get eggsCollectedByCollection(): {
    morning: number;
    afternoon: number;
    evening: number;
    total: number;
  } {
    return {
      morning: this.morningEggs,
      afternoon: this.afternoonEggs,
      evening: this.eveningEggs,
      total: this.morningEggs + this.afternoonEggs + this.eveningEggs,
    };
  }

  get totalEggs(): number {
    return this.morningEggs + this.afternoonEggs + this.eveningEggs;
  }

  get totalTrays(): number {
    return Math.floor(this.totalEggs / EGGS_PER_TRAY);
  }

  get looseEggs(): number {
    return this.totalEggs % EGGS_PER_TRAY;
  }

  get totalTrayEquivalent(): number {
    return this.totalEggs / EGGS_PER_TRAY;
  }
}
