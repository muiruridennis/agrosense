import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum RuleHostType {
  // Crops
  CROP = 'crop',
  
  // Livestock types (specific, not generic)
  DAIRY = 'dairy',           // Dairy cattle
  RUMINANT = 'ruminant',     // Goats, sheep
  POULTRY = 'poultry',       // Chickens, turkeys, etc.
}

export enum DiseaseSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface WeatherConditionThreshold {
  humidity?: { min?: number; max?: number };
  temperatureMean?: { min?: number; max?: number };
  precipitation?: { min?: number; max?: number };
  windSpeed?: { min?: number; max?: number };
  consecutiveRainyDays?: { min?: number };
}

export interface RuleCondition {
  weather?: WeatherConditionThreshold;
  
  // Crop specific
  cropStage?: string[];      // e.g. ['seedling', 'flowering', 'maturity']
  cropType?: string[];       // e.g. ['maize', 'wheat', 'tomato']
  
  // Livestock specific (dairy)
  lactationStage?: string[]; // e.g. ['early_lactation', 'mid_lactation', 'late_lactation']
  
  // Livestock specific (small ruminants)
  growthStage?: string[];    // e.g. ['young', 'growing', 'mature']
  breedingStatus?: string[]; // e.g. ['pregnant', 'non-pregnant']
  
  // Livestock specific (poultry)
  flockSize?: string[];      // e.g. ['small', 'medium', 'large']
  birdType?: string[];       // e.g. ['layer', 'broiler', 'dual_purpose']
  
  // Common livestock
  animalBreed?: string[];    // Specific breeds
  animalSpecies?: string[];  // e.g. ['cow', 'goat', 'sheep', 'chicken']
  
  // General
  season?: string[];         // e.g. ['long_rains', 'dry', 'short_rains']
  symptoms?: string[];       // If any of these symptoms are reported in health events
}

export interface DiseaseRecommendation {
  immediateActions: string[];
  preventiveMeasures: string[];
  treatment?: string;
  vetRequired: boolean;
  referenceUrl?: string;
}

@Entity('disease_rules')
export class DiseaseRule extends BaseEntity {
  @Column({ type: 'varchar' })
  diseaseName!: string; // e.g. 'Mastitis', 'Newcastle Disease', 'Grey Leaf Spot'

  @Index()
  @Column({ type: 'enum', enum: RuleHostType })
  hostType!: RuleHostType;

  /**
   * Specific target within host type:
   * - For CROP: crop name e.g. 'maize', 'wheat', 'tomato'
   * - For DAIRY: cattle breed e.g. 'friesian', 'jersey', 'ayrshire'
   * - For RUMINANT: species e.g. 'goat', 'sheep'
   * - For POULTRY: bird type e.g. 'layer', 'broiler', or breed
   */
  @Index()
  @Column({ type: 'varchar', nullable: true })
  hostTarget!: string | null;

  @Column({
    type: 'enum',
    enum: DiseaseSeverity,
    default: DiseaseSeverity.MEDIUM,
  })
  severity!: DiseaseSeverity;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb' })
  conditions!: RuleCondition;

  @Column({ type: 'jsonb' })
  recommendations!: DiseaseRecommendation;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'simple-array', nullable: true })
  applicableRegions!: string[] | null;

  @Column({ type: 'int', default: 7 })
  cooldownDays!: number; // How many days before creating another alert for same issue
}