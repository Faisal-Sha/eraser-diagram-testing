import { default as pipeFittingResolver } from "./pipefitting.resolver";
import { default as serviceResolver } from "./service.resolver";
import { ItemCategory } from "../../item.entity";
import { ItemStructure } from "../../../../interfaces/items/item-structure.interface";



/**
 * Resolves the item structure based on the provided item category.
 *
 * @param itemCategory - The category of the item to resolve the structure for.
 * @returns The resolved item structure.
 * @throws Will throw an error if the provided item category is unknown.
 */
export default function(itemCategory: ItemCategory): ItemStructure {
  switch (itemCategory) {
    case ItemCategory.PIPEFITTING:
      return pipeFittingResolver();
    case ItemCategory.SERVICE:
      return serviceResolver();
    default:
      throw new Error("Unknown item group category");
  }
}
