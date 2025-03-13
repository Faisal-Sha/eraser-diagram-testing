export enum AttributeName {
  WEIGHT = "weight",
  STANDARD = "standard",
  ERRORS = "errors",
  IS_CALCULATED = "isCalculated",
  IS_CALCULATING = "isCalculating",
  IS_PROCESSING = "isProcessing",
  FORMULAS = "formulas",
  EFFORD_HOURS = "effordHours",
  PRICE_MATERIAL = "priceMaterial",
  PRICE_ASSEMBLY = "priceAssembly",
  PRICE_MANUFACTURING = "priceManufacturing",
  PRICE_EFFORD = "priceEfford",
  PRICE_TOTAL = "priceTotal",
  TOTAL_FORMULA_CHANGE = "totalFormulaChange",
  
  CALCULATION_MATERIAL = "calculationMaterial",
  CALCULATION_EFFORD_HOURS = "calculationEffordHours",
}

export interface Attribute {
  name: AttributeName;
  value: string | number | boolean | null | undefined | object | any[];
}
