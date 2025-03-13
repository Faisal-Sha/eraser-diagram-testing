import { ItemCategory, ItemUnit } from "@common/entities/item/item.entity";
import { Formula } from "./formula.interface";
import { AttributeName } from "@common/interfaces/attribute.interface";

export enum CustomItemMode {
  CUSTOM_ITEM = "custom-item",
  OVERRIDE_ITEM = "override-item",
}

export interface CustomItem {
  id: string;
  mode: CustomItemMode;
  typeId: string;
  category: ItemCategory;
  name: string;
  unit: ItemUnit;
  specifications: {
    columns: {
      [key: string]: string | number | null;
    },
    attributes: {
      [AttributeName.EFFORD_HOURS]: number;
      [AttributeName.PRICE_MATERIAL]: number;
      [AttributeName.WEIGHT]: number;
    },
  }[];
}

export interface Settings {
  calculation: {
    seperateManufacturingAssembly: boolean;

    manufacturingSplitAmount: number;
  
    hourlyMixedPrice: number;
    hourlyManufacturingPrice: number;
    hourlyAssemblyPrice: number;
  };
  visual: {
    logo?: string | null;
  };
  formulas: Formula[];
  customItems: CustomItem[];
  currency: {
    symbol: string;
    exchangeRate: number;
  }
}
