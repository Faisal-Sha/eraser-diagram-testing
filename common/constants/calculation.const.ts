export enum MaterialFactorID {
  WEIGHT = 'WEIGHT',
  QUANTITY = 'QUANTITY',
  UNIT_PRICE = 'UNIT_PRICE',
  MATERIAL_SURCHARGE = 'MATERIAL_SURCHARGE',
  FORM_FACTOR = 'FORM_FACTOR',
  CUSTOM_MATERIAL_PRICE = 'CUSTOM_MATERIAL_PRICE',
  CUSTOM_EFFORD_HOURS = 'CUSTOM_EFFORD_HOURS',
}

export interface MaterialCalculation {
  factors?: {
    id: MaterialFactorID;
    value: number;
  }[];
  formula?: string;
}
