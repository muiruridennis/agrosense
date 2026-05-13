// health-event/enums/health-condition.enum.ts
export enum HealthCondition {
  // Dairy
  MASTITIS = 'mastitis',
  LAMENESS = 'lameness',
  KETOSIS = 'ketosis',
  MILK_FEVER = 'milk_fever',
  RETAINED_PLACENTA = 'retained_placenta',
  METRITIS = 'metritis',
  DISPLACED_ABOMASUM = 'displaced_abomasum',
  PNEUMONIA = 'pneumonia',

  // Small Ruminants
  BLOAT = 'bloat',
  COCCIDIOSIS = 'coccidiosis',
  FOOT_ROT = 'foot_rot',
  PREGNANCY_TOXEMIA = 'pregnancy_toxemia',
  INTERNAL_PARASITES = 'internal_parasites',
  EXTERNAL_PARASITES = 'external_parasites',
  ORF = 'orf',

  // Poultry
  NEWCASTLE = 'newcastle',
  GUMBORO = 'gumboro',
  COCCIDIOSIS_POULTRY = 'coccidiosis_poultry',
  RESPIRATORY = 'respiratory',
  EGG_DROP = 'egg_drop',
  FOWL_POX = 'fowl_pox',
  SALMONELLA = 'salmonella',

  // Common
  DIARRHEA = 'diarrhea',
  FEVER = 'fever',
  INJURY = 'injury',
  ANOREXIA = 'anorexia',
  DEHYDRATION = 'dehydration',
  OTHER = 'other',
}