import { ItemCategory } from "@common/entities/item/item.entity";
import { CustomItemMode } from "./settings.interface";

export interface CustomItem {
  id: string;
  mode: CustomItemMode;
  typeId: string;
  category: ItemCategory;
  name: string;
  unit: string;
  specifications: {
    [key: string]: string;
  }[];
}