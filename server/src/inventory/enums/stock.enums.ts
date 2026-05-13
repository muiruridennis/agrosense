export enum StockCategory {
  FEED = 'feed',
  VACCINE = 'vaccine',
  MEDICATION = 'medication',
  SUPPLEMENT = 'supplement',
  DAIRY_CLEANING = 'dairy_cleaning',
  TEAT_DIP = 'teat_dip',
  FERTILIZER = 'fertilizer',
  PESTICIDE = 'pesticide',
  SEED = 'seed',
  CONSUMABLE = 'consumable',
  EQUIPMENT = 'equipment',
}

export enum StockUnit {
  KG = 'kg',
  LITRE = 'litre',
  UNIT = 'unit',
  BAG = 'bag',
  DOSE = 'dose',
  BOTTLE = 'bottle',
}

export enum StockAdjustmentReason {
  SPOILAGE = 'spoilage',
  LOSS = 'loss',
  THEFT = 'theft',
  EXPIRED = 'expired',
  DAMAGED = 'damaged',
  RECOUNT = 'recount',
  OTHER = 'other',
}

export enum StockStatus {
  ADEQUATE = 'adequate',
  LOW = 'low',
  CRITICAL = 'critical',
  EXCESS = 'excess',
  UNKNOWN = 'unknown',
}

export enum StockAlertType {
  LOW_STOCK = 'low_stock',
  CRITICAL_STOCK = 'critical_stock',
  EXPIRY_WARNING = 'expiry_warning',
  EXPIRED = 'expired',
  OVERSTOCK = 'overstock',
  QUALITY_ISSUE = 'quality_issue',
}

export enum StockAlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}