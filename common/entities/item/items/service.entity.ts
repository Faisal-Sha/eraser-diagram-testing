import { ItemCategory, ItemEntity } from "../item.entity";

export class ItemServiceEntity extends ItemEntity {

  public quantity: number;

/**
 * Creates an instance of ItemServiceEntity.
 * 
 * @param data - A partial item service entity.
 * @param duplicate - If true, a new id will be generated for the item. Otherwise, the id from the data will be used.
 */
  constructor(data: Partial<ItemServiceEntity>, duplicate?: boolean) {
    super({
      ...data,
      category: ItemCategory.SERVICE
    }, duplicate);
    
    this.quantity = data.quantity ?? 1;
  }

  /**
   * Returns the relevant column list for the service item entity.
   * 
   * @remarks
   * This method is used to determine which fields are relevant for the service item's context.
   * The returned list is used in various calculations and operations related to the service item.
   * 
   * @returns The relevant column list for the service item entity.
   */
  public override getRelevantColumnList(): string[] {
    return [
      ...super.getRelevantColumnList(),
      "quantity"
    ];
  }

  /**
   * Converts the service item entity to a JSON object.
   * 
   * @returns A JSON object representing the service item entity.
   * 
   * @remarks
   * This method returns a JSON object containing the essential properties of the service item entity.
   * It includes the `id`, `typeId`, `category`, `attributes`, and `quantity` of the item.
   */
  public override toJSON(): Record<string, any> {
    const json = super.toJSON();
    json["quantity"] = this.quantity;
    return json;
  }
}