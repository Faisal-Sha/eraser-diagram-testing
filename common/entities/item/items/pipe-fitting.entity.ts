import { ItemCategory, ItemEntity, ItemUnit } from "../item.entity";

export class ItemPipeFittingEntity extends ItemEntity {

  public quantity: number;
  public material: string | null;

  public dn1: number | null;
  public s1: number | null;

  public dn2: number | null;
  public s2: number | null;

  /**
   * Constructor for a pipe fitting item entity.
   *
   * @param pipeFittingData - A partial item pipe fitting entity.
   * @param duplicate - If true, a new id will be generated for the item. Otherwise, the id from the pipeFittingData will be used.
   */
  constructor(pipeFittingData: Partial<ItemPipeFittingEntity>, duplicate?: boolean) {
    super({
      ...pipeFittingData,
      category: ItemCategory.PIPEFITTING
    }, duplicate);
    
    this.quantity = pipeFittingData.quantity ?? 1;
    this.material = pipeFittingData.material || null;
    this.dn1 = pipeFittingData.dn1 || null;
    this.s1 = pipeFittingData.s1 || null;

    this.dn2 = pipeFittingData.dn2 || null;
    this.s2 = pipeFittingData.s2 || null;
  }

  /**
   * Determines the unit of measurement for the pipe fitting item based on its typeId.
   * Custom items and items without a typeId are considered to have no unit.
   *
   * @returns The unit of measurement for the pipe fitting item.
   */
  public override getUnit(): ItemUnit {
    if (this.isCustom() || !this.typeId) {
      return ItemUnit.NONE;
    }
  
    const typeId = parseInt(this.typeId);
    if (!typeId && typeId !== 0) {
      return ItemUnit.NONE;
    }
    
    if (typeId >= 1000 && typeId < 2000) {
      return ItemUnit.M;
    }
    return ItemUnit.PCS;
  }

  /**
   * Checks if the pipe fitting item is complete based on its properties.
   * Custom items are never complete and need to be handled with the custom-item-service.
   *
   * @returns True if the item is complete, false otherwise.
   */
  public override isComplete(): boolean {
    // Custom items are never complete and need to be handled with the custom-item-service
    if (this.isCustom() || !this.typeId) {
      return false;
    }
    return super.isComplete() && this.material !== null && this.dn1 !== null && (this.isReduced() || this.s1 !== null) && (!this.isExtended() || (this.dn2 !== null && this.s2 !== null));
  }

  /**
   * Determines if the pipe fitting item is extended based on its typeId.
   * Custom items are always considered extended.
   *
   * @param typeId - The typeId of the pipe fitting item.
   * @returns True if the item is extended, false otherwise.
   */
  private isExtended(): boolean {
    // Custom items are always extended
    if (this.isCustom() || !this.typeId) {
      return true;
    }
    const typeId = parseInt(this.typeId);
    return (typeId >= 3100 && typeId < 3200) || (typeId >= 4000 && typeId < 5000);
  }

  /**
   * Determines if the pipe fitting item is reduced based on its typeId.
   * Custom items are not considered reduced.
   *
   * @returns True if the item is reduced, false otherwise.
   */

  private isReduced() {
    if (this.isCustom() || !this.typeId) {
      return false;
    }

    const typeId = parseInt(this.typeId);
    return typeId >= 6000 && typeId < 7000;
  }

  /**
   * Returns the relevant column list for the pipe fitting item entity.
   * Custom items are handled by the custom-item-service and are not included in the list.
   *
   * @returns The relevant column list for the pipe fitting item entity.
   *
   * @example
   */
  public override getRelevantColumnList(): string[] {
    return [
      ...super.getRelevantColumnList(),
      "quantity",
      "material",
      "dn1",
      ...(!this.isReduced() ? ["s1"] : []),
      ...(this.isExtended() ? ["dn2", "s2"] : [])
    ];
  }

  /**
   * Converts the pipe fitting item entity to a JSON object.
   *
   * @remarks
   * This method creates a JSON object containing the essential properties of the pipe fitting item entity.
   * It includes the `id`, `typeId`, `category`, and `attributes` of the item, as well as the `quantity`, `material`, `dn1`, and
   * `s1` properties. If the item is extended, the `dn2` and `s2` properties are also included.
   *
   * @param none
   *
   * @returns A JSON object representing the pipe fitting item entity.
   *
   * @example
   * ```typescript
   * const pipeFittingItem = new ItemPipeFittingEntity({
   *   id: "123",
   *   typeId: "1001",
   *   category: ItemCategory.PIPEFITTING,
   *   attributes: {
   *     description: "Pipe fitting item"
   *   },
   *   quantity: 2,
   *   material: "Steel",
   *   dn1: 10,
   *   s1: 5
   * });
   *
   * const json = pipeFittingItem.toJSON();
   * console.log(json);
   * // Output:
   * // {
   * //   id: "123",
   * //   typeId: "1001",
   * //   category: "PIPEFITTING",
   * //   attributes: {
   * //     description: "Pipe fitting item"
   * //   },
   * //   quantity: 2,
   * //   material: "Steel",
   * //   dn1: 10,
   * //   s1: 5
   * // }
   * ```
   */
  public override toJSON(): Record<string, any> {
    const json = super.toJSON();
    json["quantity"] = this.quantity;
    json["material"] = this.material;
    json["dn1"] = this.dn1;

    if (!this.isReduced()) {
      json["s1"] = this.s1;
    }

    if (this.isExtended()) {
      json["dn2"] = this.dn2;
      json["s2"] = this.s2;
    }
    return json;
  }
}