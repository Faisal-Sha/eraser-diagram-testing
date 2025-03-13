import { ItemCategory, ItemEntity } from "../item.entity";
import { ItemGroupEntity } from "../items/group.entity";
import { ItemPipeFittingEntity } from "../items/pipe-fitting.entity";
import { ItemServiceEntity } from "../items/service.entity";

export const ITEM_CATEGORY_TO_ICON: {[category: string]: string} = {
  [ItemCategory.GROUP]: 'pi pi-folder',
  [ItemCategory.PIPEFITTING]: 'ei ei-pipe-rounded-2',
  [ItemCategory.SERVICE]: 'pi pi-wrench',
};

/**
 * Determines if an item is an instance of a specified category.
 * 
 * @param item - The item to check.
 * @param category - The category to check against.
 * @returns True if the item's category matches the specified category, false otherwise.
 */
export function isItemInstanceOfCategory(item: ItemEntity, category: ItemCategory): boolean {
  return item.category === category;
}

/**
 * Returns the correct class for an item based on its category.
 * @param item - Item with `category` property
 * @returns Class of the item (ItemGroupEntity, ItemPipeFittingEntity, ItemServiceEntity)
 * @throws Error if the category is not known
 */
export function getItemInstanceClassByCategory(item: { category: ItemCategory }): typeof ItemEntity {
  switch (item.category) {
    case ItemCategory.GROUP:
      return ItemGroupEntity;
    case ItemCategory.PIPEFITTING:
      return ItemPipeFittingEntity;
    case ItemCategory.SERVICE:
      return ItemServiceEntity;
  }
  throw new Error(`Unknown item category: ${item.category}`);
}

/**
 * Instantiates an item entity based on the given category and data.
 * 
 * @param itemData - The item data, which must include a `category` property.
 * @param duplicate - If true, a new id will be generated and the item will be marked as duplicated. Defaults to false if not provided.
 * 
 * @template T - The type of item entity to instantiate. Must be a subclass of `ItemEntity`.
 * 
 * @returns An instance of the specified item entity class, populated with the provided data.
 * 
 * @throws Error - If the provided `category` is not recognized.
 */
export function instanciateItem<T extends typeof ItemEntity>(itemData: { category: ItemCategory } & { [key: string]: any }, duplicate?: boolean): InstanceType<T> {
  const itemClass = getItemInstanceClassByCategory(itemData);
  return new itemClass(itemData, duplicate) as InstanceType<T>;
}