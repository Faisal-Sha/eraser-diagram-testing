import { ItemEntity } from "@common/entities/item/item.entity";
import { Attribute } from "./attribute.interface";


/**
 * Interface for a calculation request.
 */
export interface CalculationRequest {
  items: ItemEntity[];
}

/**
 * Interface for a calculation response.
 */
export interface CalculationResponse {
  items: {
    id: string;
    attributes: Attribute[];
  }[];
}
