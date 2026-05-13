// health-event/enums/treatment-route.enum.ts
export enum TreatmentRoute {
  ORAL = 'oral',
  INJECTION_IM = 'injection_im', // Intramuscular
  INJECTION_IV = 'injection_iv', // Intravenous
  INJECTION_SC = 'injection_sc', // Subcutaneous
  TOPICAL = 'topical',
  INTRAMAMMARY = 'intramammary',
  INHALATION = 'inhalation',
  FEED_ADDITIVE = 'feed_additive',
  WATER_ADDITIVE = 'water_additive',
}

// ─────────────────────────────────────────────────────────────────────

// health-event/enums/withdrawal-type.enum.ts
export enum WithdrawalType {
  MILK = 'milk',
  EGGS = 'eggs',
  MEAT = 'meat',
  ALL = 'all',
}

// ─────────────────────────────────────────────────────────────────────

// health-event/enums/diagnostic-type.enum.ts
export enum DiagnosticType {
  CLINICAL = 'clinical',
  LAB_CULTURE = 'lab_culture',
  LAB_PCR = 'lab_pcr',
  BLOOD_WORK = 'blood_work',
  URINALYSIS = 'urinalysis',
  FECAL = 'fecal',
  ULTRASOUND = 'ultrasound',
  NECROPSY = 'necropsy',
  MILK_TEST = 'milk_test',
  EGG_TEST = 'egg_test',
}

// ─────────────────────────────────────────────────────────────────────

// health-event/enums/health-condition.enum.ts
export enum HealthCondition {
  // DAIRY
  MASTITIS = 'mastitis',
  LAMENESS = 'lameness',
  KETOSIS = 'ketosis',
  MILK_FEVER = 'milk_fever',
  RETAINED_PLACENTA = 'retained_placenta',
  METRITIS = 'metritis',
  DISPLACED_ABOMASUM = 'displaced_abomasum',
  PNEUMONIA = 'pneumonia',
  HYPOCALCEMIA = 'hypocalcemia',
  LAMINITIS = 'laminitis',

  // SMALL RUMINANTS
  BLOAT = 'bloat',
  COCCIDIOSIS = 'coccidiosis',
  FOOT_ROT = 'foot_rot',
  PREGNANCY_TOXEMIA = 'pregnancy_toxemia',
  INTERNAL_PARASITES = 'internal_parasites',
  EXTERNAL_PARASITES = 'external_parasites',
  ORF = 'orf',
  MASTITIS_RUMINANT = 'mastitis_ruminant',
  PNEUMONIA_RUMINANT = 'pneumonia_ruminant',

  // POULTRY
  NEWCASTLE = 'newcastle',
  GUMBORO = 'gumboro',
  COCCIDIOSIS_POULTRY = 'coccidiosis_poultry',
  RESPIRATORY = 'respiratory',
  EGG_DROP = 'egg_drop',
  FOWL_POX = 'fowl_pox',
  SALMONELLA = 'salmonella',
  MYCOPLASMOSIS = 'mycoplasmosis',
  INFECTIOUS_BURSAL_DISEASE = 'infectious_bursal_disease',
  AVIAN_INFLUENZA = 'avian_influenza',

  // COMMON
  DIARRHEA = 'diarrhea',
  FEVER = 'fever',
  INJURY = 'injury',
  ANOREXIA = 'anorexia',
  DEHYDRATION = 'dehydration',
  WEAKNESS = 'weakness',
  LAMENESS_GENERAL = 'lameness_general',
  WOUND = 'wound',
  INFECTION = 'infection',
  OTHER = 'other',
}
