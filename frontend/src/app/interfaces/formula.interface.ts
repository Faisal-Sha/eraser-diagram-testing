import { AttributeName } from "@common/interfaces/attribute.interface";

export interface Formula {
  id: string;
  name: string;
  active: boolean;
  conditions: FormulaCondition[];
  calculation: {
    effordHours: string | undefined;
    priceMaterial: string | undefined;
  }
}

export interface FormulaAttribute {
    id: string;
    name: string;
    formulas: { [key: string]: string };
    changes: ChangesEntity;
    totalChanges?: number;
}

export interface FormulaTotalsAttribute {
  [key: string]: number;
}

export interface FormulaCondition {
  option: string | undefined;
  operation: string | undefined;
  value: number | string | undefined;
}

// Typ für Attribute mit `before` und `after`
interface ChangesEffordAndMaterial {
  before: number;
  after: number;
  value: number;
  totalChanges?: number;
}

// Typ für Attribute mit nur `value` (Manufactuting und Assembly)
interface ChangesGeneral {
  value: number;
  totalChanges?: number;
}

export type ChangesEntity = {
  [key in AttributeName.EFFORD_HOURS | AttributeName.PRICE_MATERIAL | AttributeName.PRICE_EFFORD | AttributeName.PRICE_MANUFACTURING | AttributeName.PRICE_ASSEMBLY]: 
    key extends AttributeName.EFFORD_HOURS | AttributeName.PRICE_MATERIAL 
      ? ChangesEffordAndMaterial 
      : ChangesGeneral;
};
