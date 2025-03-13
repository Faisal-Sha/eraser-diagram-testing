import { Attribute, AttributeName } from "../../interfaces/attribute.interface";
import { cloneDeep } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { CUSTOM_ITEM_PREFIX } from "../../constants/custom-item.const";

/**
 * Item Categories
 */
export enum ItemCategory {
  GROUP = 'group',
  PIPEFITTING = 'pipefitting',
  SERVICE = 'service'
}

/**
 * Item Units
 */
export enum ItemUnit {
  NONE = 'none',
  CUSTOM = 'custom',
  PCS = 'pcs',
  M = 'm',
  H = 'h'
}

/**
 * Item Unit Labels
 */
export const ITEM_UNIT_LABEL_MAP: Record<ItemUnit, string> = {
  [ItemUnit.NONE]: '',
  [ItemUnit.CUSTOM]: '',
  [ItemUnit.PCS]: 'unit.pcs',
  [ItemUnit.M]: 'unit.m',
  [ItemUnit.H]: 'unit.h'
}

/**
 * Item Units
 */
export const ITEM_UNITS = [{
  i18nLabel: ITEM_UNIT_LABEL_MAP[ItemUnit.PCS],
  value: ItemUnit.PCS
}, {
  i18nLabel: ITEM_UNIT_LABEL_MAP[ItemUnit.M],
  value: ItemUnit.M
}]

/**
 * Constructor for an item entity
 */
export type ItemEntityConstructor<T extends ItemEntity> = {
  new (itemData: Partial<T>): T
};

export class ItemEntity {

  /**
   * Unique identifier of the item
   */
  public id!: string;

  /**
   * Type identifier of the item (Engify-ID)
   */
  public typeId!: string | null;

  /**
   * Category of the item
   */
  public category!: ItemCategory;

  /**
   * Dynamic attributes of the item
   */
  public attributes!: Attribute[];

  /**
   * Parent item entity
   */
  public parent?: ItemEntity;

  /**
   * Constructor for an item entity
   * 
   * @param itemData - data for the item entity
   */
  constructor(itemData: Partial<ItemEntity>, duplicate?: boolean) {
    if (!itemData.category) {
      throw new Error("Category is required for item group entity");
    }
    this.category = itemData.category;

    this.id = !duplicate ? (itemData.id || uuidv4()) : uuidv4();
    
    this.typeId = itemData.typeId ?? null;
    this.attributes = cloneDeep(itemData.attributes || []);
  }

  /**
   * Returns true if the item is complete for a calculation request.
   * 
   * @returns true if the item is complete
   */
  public isComplete(): boolean {
    return true;
  }

  /**
   * Checks if the item is a custom item.
   * 
   * @returns true if the item is a custom item
   */
  public isCustom(): boolean {
    return this.typeId?.startsWith(CUSTOM_ITEM_PREFIX) || false;
  }

  /**
   * Finds and returns the attribute with the given name from the item's attributes.
   *
   * @param attributeName - The name of the attribute to find.
   * @returns The attribute with the given name if found, otherwise `undefined`.
   */
  private findAttribute(attributeName: AttributeName): Attribute | undefined {
    return this.attributes.find(attribute => attribute.name === attributeName);
  }

  /**
   * Retrieves the value of an attribute with the given name from the item's attributes.
   *
   * @param attributeName - The name of the attribute to retrieve.
   * @returns The value of the attribute if found, otherwise `undefined`.
   */
  public getAttribute(attributeName: AttributeName): Attribute["value"] | undefined {
    return this.findAttribute(attributeName)?.value ?? undefined;
  }

  /**
   * Sets the value of an attribute with the given name in the item's attributes.
   * If the attribute already exists, its value is updated.
   * If the attribute does not exist, a new attribute is created and added to the item's attributes.
   *
   * @param attributeName - The name of the attribute to set.
   * @param value - The value to set for the attribute.
   *
   * @returns {void}
   */
  public setAttribute(attributeName: AttributeName, value: Attribute["value"]): void {
    const attribute = this.findAttribute(attributeName);
    if (attribute) {
      attribute.value = value;
    } else {
      this.attributes.push({ name: attributeName, value });
    }
  }

  /**
   * Deletes an attribute with the given name from the item's attributes.
   *
   * @param attributeName - The name of the attribute to delete.
   *
   * @returns {void}
   *
   * @throws Will throw an error if the attribute with the given name does not exist.
   */
  public deleteAttribute(attributeName: AttributeName): void {
    this.attributes = this.attributes.filter(attribute => attribute.name !== attributeName);
  }

  /**
   * Deletes all attributes associated with the item.
   *
   * @remarks
   * This method clears the `attributes` array of the item, effectively removing all attribute data.
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * const item = new ItemEntity({ category: ItemCategory.PIPEFITTING });
   * item.setAttribute('diameter', 50);
   * item.setAttribute('length', 100);
   * console.log(item.attributes); // Output: [{ name: 'diameter', value: 50 }, { name: 'length', value: 100 }]
   * item.deleteAttributes();
   * console.log(item.attributes); // Output: []
   * ```
   */
  public deleteAttributes(): void {
    this.attributes = [];
  }

  /**
   * Returns a list of relevant fields for the item.
   *
   * @remarks
   * This method is used to determine which fields are relevant for the item's context.
   * The returned list is used in various calculations and operations related to the item.
   *
   * @returns A list of relevant field names for the item.
   *
   * @example
   * ```typescript
   * const item = new ItemEntity({ category: ItemCategory.PIPEFITTING });
   * console.log(item.getRelevantColumnList()); // Output: ['category', 'typeId']
   * ```
   */
  public getRelevantColumnList(): string[] {
    return [
      'category',
      'typeId'
    ];
  }

  /**
   * Checks if the column is available for the item.
   * Every column before the requested column must be available to make the requested column available.
   *
   * @param column - Name of the column to check availability.
   * @returns True if the column is available, false otherwise.
   *
   * @remarks
   * This function iterates through the relevant columns of the item and checks if each column is available.
   * It ensures that all columns before the requested column are also available.
   * If a column is not available or is undefined or null, the function returns false.
   * If the requested column is found, the function returns true.
   *
   * @example
   * ```typescript
   * const item = new ItemEntity({ category: ItemCategory.PIPEFITTING });
   * console.log(item.isColumnAvailable('typeId')); // Output: true
   * console.log(item.isColumnAvailable('attributes')); // Output: false
   * ```
   */
  public isColumnAvailable(column: string): boolean {
    const availableColumns = this.getRelevantColumnList();
    if (!availableColumns.includes(column)) {
      return false;
    }

    for (const availableColumn of availableColumns) {
      if (availableColumn === column) {
        return true;
      }

      if (typeof this[availableColumn as keyof this] === 'undefined' || this[availableColumn as keyof this] === null) {
        break;
      }
    }
    return false;
  }

  /**
   * Retrieves the unit associated with the item.
   *
   * @returns The unit of the item. In this case, it always returns `ItemUnit.NONE` as the base implementation.
   *
   * @remarks
   * This method is intended to be overridden in subclasses to provide specific unit information for different item categories.
   * By default, it returns `ItemUnit.NONE`.
   *
   * @example
   * ```typescript
   * const item = new ItemEntity({ category: ItemCategory.PIPEFITTING });
   * console.log(item.getUnit()); // Output: ItemUnit.NONE
   * ```
   */
  public getUnit(): ItemUnit {
    return ItemUnit.NONE;
  }

  /**
   * Converts the item entity to a JSON object.
   *
   * @returns A JSON object representing the item entity.
   *
   * @remarks
   * This method returns a JSON object containing the essential properties of the item entity.
   * It includes the `id`, `typeId`, `category`, and `attributes` of the item.
   * The `attributes` are deeply cloned to ensure immutability.
   *
   * @example
   * ```typescript
   * const item = new ItemEntity({ category: ItemCategory.PIPEFITTING });
   * item.setAttribute('diameter', 50);
   * item.setAttribute('length', 100);
   * console.log(item.toJSON());
   * // Output: { id: 'uuid-value', typeId: null, category: 'pipefitting', attributes: [{ name: 'diameter', value: 50 }, { name: 'length', value: 100 }] }
   * ```
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      typeId: this.typeId,
      category: this.category,
      attributes: cloneDeep(this.attributes),
    };
  }

  /**
   * Creates a JSON object containing only the relevant properties of the item entity.
   *
   * @remarks
   * This method is used to create a JSON object that includes only the essential properties of the item entity,
   * based on the provided parameters. It can be used for serialization or comparison purposes.
   *
   * @param untilColumn - (Optional) The name of the column until which the relevant properties should be included.
   *                      If not provided, all relevant properties will be included.
   * @param ignoreColumns - (Optional) An array of column names to be ignored while creating the JSON object.
   *                        If not provided, no columns will be ignored.
   *
   * @returns A JSON object containing the relevant properties of the item entity.
   *
   * @example
   * ```typescript
   * const item = new ItemEntity({ category: ItemCategory.PIPEFITTING });
   * item.setAttribute('diameter', 50);
   * item.setAttribute('length', 100);
   * console.log(item.toRelevantJSON('length'));
   * // Output: { id: 'uuid-value', typeId: null, category: 'pipefitting', attributes: [{ name: 'diameter', value: 50 }] }
   * console.log(item.toRelevantJSON(undefined, ['attributes']));
   * // Output: { id: 'uuid-value', typeId: null, category: 'pipefitting' }
   * ```
   */
  public toRelevantJSON(untilColumn?: string, ignoreColumns?: string[]): Record<string, any> {
    const result = this.toJSON();
    const relevantColumns = this.getRelevantColumnList();
    const relevantResult: Record<string, any> = {};
    for (const column of relevantColumns) {
      if (ignoreColumns && ignoreColumns.includes(column)) {
        continue;
      }
      if (untilColumn && column === untilColumn) {
        break;
      }
      relevantResult[column] = result[column as keyof typeof result];
    }
    return relevantResult;
  }

  /**
   * Generates a unique hash based on the relevant properties of the item entity for calculation purposes.
   *
   * @remarks
   * This method is used to create a unique hash based on the essential properties of the item entity,
   * which can be used for comparison or caching purposes during calculations.
   *
   * @param untilColumn - (Optional) The name of the column until which the relevant properties should be included.
   *                      If not provided, all relevant properties will be included.
   * @param ignoreColumns - (Optional) An array of column names to be ignored while creating the hash.
   *                        If not provided, no columns will be ignored.
   *
   * @returns A string representing the unique hash of the relevant properties of the item entity.
   *
   * @example
   * ```typescript
   * const item = new ItemEntity({ category: ItemCategory.PIPEFITTING });
   * item.setAttribute('diameter', 50);
   * item.setAttribute('length', 100);
   * console.log(item.getCalculationHash('length'));
   * // Output: '{"id":"uuid-value","typeId":null,"category":"pipefitting","attributes":[{"name":"diameter","value":50}]}'
   * console.log(item.getCalculationHash(undefined, ['attributes']));
   * // Output: '{"id":"uuid-value","typeId":null,"category":"pipefitting"}'
   * ```
   */
  public getCalculationHash(untilColumn?: string, ignoreColumns?: string[]): string {
    return JSON.stringify(this.toRelevantJSON(untilColumn, ignoreColumns));
  }
}

