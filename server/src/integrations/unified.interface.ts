export interface PurchaseCreatedEvent {
  purchaseId: string;
  farmId: string;
  itemId: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  invoiceNumber?: string;
  purchaseDate: Date;
  batchNumber?: string;
}

export interface ConsumptionRecordedEvent {
  consumptionId: string;
  farmId: string;
  itemId: string;
  quantity: number;
  unit: string;
  consumedDate: Date;
  relatedProductionLogId: string;
  relationType:
    | 'flock_record'
    | 'lactation_record'
    | 'health_event'
    | 'crop_activity';
}

export interface AdjustmentCreatedEvent {
  adjustmentId: string;
  farmId: string;
  itemId: string;
  adjustmentType: 'spoilage' | 'expired' | 'theft' | 'damaged' | 'recount';
  quantity: number;
  unit: string;
  adjustmentDate: Date;
  reason: string;
  details?: string;
  recordedBy: string;
  supplier?: string;
  invoiceNumber?: string;
}

export interface FlockRecordCreatedEvent {
  flockRecordId: string;
  flockId: string;
  farmId: string;
  feedItemId: string;
  feedConsumedKg: number;
  eggsProduced: number;
  recordDate: Date;
  mortalityCount: number;
  cullsCount: number;
  liveBirds: number;
  invoiceNumber?: string;
  supplier: string;
  flockType: 'layers' | 'broilers';
  breed: string;
}

export interface EggsCollectedEvent {
  flockRecordId: string;
  flockId: string;
  farmId: string;
  morningEggs: number;
  eveningEggs: number;
  brokenEggs: number;
  dirtyEggs: number;
  totalEggs: number;
  sellableEggs: number;
  liveBirds: number;
  recordDate: Date;
  flockType: string;
  breed: string;
}

export interface BroilersSoldEvent {
  saleId: string;
  flockId: string;
  farmId: string;
  quantity: number;
  averageWeightKg: number;
  pricePerKg: number;
  totalAmount: number;
  saleDate: Date;
  buyer?: string;
  flockType: string;
  breed: string;
}

export interface MortalityRecordedEvent {
  flockRecordId: string;
  flockId: string;
  farmId: string;
  mortalityCount: number;
  cullsCount: number;
  totalLosses: number;
  birdValue: number;
  flockType: string;
  breed: string;
  recordDate: Date;
  currentLiveBirds: number;
}

export interface HealthEventMedicationEvent {
  healthEventId: string;
  farmId: string;
  medicationId: string;
  quantity: number;
  animalId: string;
  animalType: string;
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  eventDate: Date;
  recordedBy: string;
  invoiceNumber?: string;
  supplier: string;
  treatmentCost?: number;
}

export interface HealthEventAffectsFlockEvent {
  healthEventId: string;
  flockId: string;
  farmId: string;
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  estimatedProductionImpact?: number;
  estimatedMortalityRisk?: number;
  treatmentCost?: number;
  eventDate: Date;
}

export interface FlockClosedEvent {
  flockId: string;
  farmId: string;
  closureReport: {
    breed: string;
    flockType: string;
    ageInDays: number;
    initialCount: number;
    finalCount: number;
    totalFeedCost: number;
    totalRevenue: number;
    netProfit: number;
    roi: number;
    mortalityPercent: number;
  };
}
