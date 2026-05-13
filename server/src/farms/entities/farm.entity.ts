import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { FarmRecord } from '../../records/entities/farm-record.entity';
import { DiseaseAlert } from '../../disease-engine/entities/disease-alert.entity';
import { Recommendation } from '../../recommendations/entities/recommendation.entity';
import { Plot } from '../../plots/entities/plot.entity';
import { CreditProfile } from '../../credit-profile/entities/credit-profile.entity';
import { Alert } from '../../alerts/entities/alert.entity';
import { Report } from '../../reports/entities/report.entity';
import { FarmMember } from '../../farm-members/entities/farm-member.entity';
import { PoultryHouse } from '../../poultry/entities/poultry-house.entity';
import { Cow } from '../../dairy/entities/cow.entity';
import { Ruminant } from '../../smallruminants/entities/ruminant.entity';
import { StockItem } from '../../inventory/entities';

export type GeoPoint = { type: 'Point'; coordinates: [number, number] };
export type GeoPolygon = { type: 'Polygon'; coordinates: number[][][] };

@Entity('farms')
@Unique(['ownerId', 'name']) // ✅ One farm name per owner
export class Farm extends BaseEntity {
  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'float' })
  areaHectares!: number;

  @Column({ type: 'varchar' })
  country!: string;

  @Column({ type: 'varchar' })
  region!: string;

  @Column({ type: 'varchar', nullable: true })
  subRegion!: string | null;

  @Index({ spatial: true })
  @Column({
    type: 'geometry', // not 'geography'
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  geoPoint!: GeoPoint | null;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  boundary!: GeoPolygon | null;

  @Column({ type: 'varchar', default: 'UTC', length: 50 })
  timezone!: string;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.farms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  // Plot is the child of Farm — plots live inside farms/entities/
  @OneToMany(() => Plot, (plot) => plot.farm, { cascade: true })
  plots!: Plot[];

  // FarmLedger records
  @OneToMany(() => FarmRecord, (record) => record.farm, { cascade: true })
  records!: FarmRecord[];

  // Disease alerts from AgroAdvisor
  @OneToMany(() => DiseaseAlert, (alert) => alert.farm)
  diseaseAlerts!: DiseaseAlert[];

  // Recommendations from AgroAdvisor
  @OneToMany(() => Recommendation, (rec) => rec.farm)
  recommendations!: Recommendation[];

  @OneToOne(() => CreditProfile, (profile) => profile.farm)
  creditProfile!: CreditProfile | null;

  @OneToMany(() => Alert, (alert) => alert.farm)
  alerts: Alert[];

  @OneToMany(() => Report, (report) => report.farm, { cascade: true })
  reports: Report[];

  @OneToMany(() => FarmMember, (member) => member.farm, { cascade: true })
  members!: FarmMember[];

  @OneToMany(() => PoultryHouse, (house) => house.farm, { cascade: true })
  poultryHouses!: PoultryHouse[];

  // DAIRY MODULE
  @OneToMany(() => Cow, (cow) => cow.farm, { cascade: true })
  cows!: Cow[];

  // SMALL RUMINANTS MODULE
  @OneToMany(() => Ruminant, (ruminant) => ruminant.farm, { cascade: true })
  ruminants!: Ruminant[];

  @OneToMany(() => StockItem, (stockItem) => stockItem.farm)
  stockItems!: StockItem[];

  // No jobs — Bull jobs live in Redis, not Postgres
  // No weatherSnapshots — weather is fetched live and cached in Redis
  // No reports — PDFs are generated on-demand, not stored as entities
  // No notifications — Notification belongs to User, not Farm
  // No cropCycles — CropCycle belongs to Plot, access via farm.plots[].cropCycles
}
