import { ItemCategory, ItemEntity } from "../item.entity";
import { instanciateItem, isItemInstanceOfCategory } from "../resolvers/item.resolver";

export class ItemGroupEntity extends ItemEntity {
  public readonly contains: ItemCategory;

  public name: string;

  public expanded: boolean;

  private _items!: ItemEntity[];
  /**
   * Retrieves the items in the group.
   * @returns An array of item entities that are in the group.
   */
  public get items(): ItemEntity[] {
    return this._items;
  }

  /**
   * Creates a new item group entity.
   * @param itemGroupData - A partial item group entity.
   * @param duplicate - If true, a new id will be generated for the item. Otherwise, the id from the itemGroupData will be used.
   * @throws {Error} - If the 'contains' property is not set in the itemGroupData.
   */
  constructor(itemGroupData: Partial<ItemGroupEntity>, duplicate?: boolean) {
    itemGroupData = { ...itemGroupData };

    const items = (itemGroupData as any)._items;
    delete (itemGroupData as any)._items;

    super({
      ...itemGroupData,
      category: ItemCategory.GROUP
    }, duplicate);

    if (!itemGroupData.contains) {
      throw new Error("Contains is required for item group entity");
    }
    this.contains = itemGroupData.contains;

    this.name = itemGroupData.name || "";
    this.expanded = itemGroupData.expanded ?? true;

    this._items = [];
    if (items) {
      for (let i = 0; i < items.length; i++) {
        this.addItem(instanciateItem(items[i], duplicate));
      }
    }
  }

  /**
   * Retrieves an item from the group by its id.
   * If the item is a group, it will recursively search within its sub-groups.
   *
   * @param itemId - The id of the item to retrieve.
   * @param type - An optional type to filter the item. If provided, only items of this type will be returned.
   *
   * @returns The item with the specified id, or `undefined` if not found.
   * If the `type` parameter is provided, the returned item will be of the specified type.
   * If the item is a group, the returned item will be of type `ItemGroupEntity`.
   */
  public getItem<T extends typeof ItemEntity>(itemId: string, type?: T): InstanceType<T> | undefined {
    if (this.id === itemId) {
      return this as InstanceType<T>;
    }

    for (const item of this.items) {
      if (item.id === itemId && (!type || item instanceof type)) {
        return item as InstanceType<T>;
      }

      if (item instanceof ItemGroupEntity) {
        const subItem = item.getItem(itemId, type);
        if (subItem) {
          return subItem;
        }
      }
    }
    return undefined;
  }

  /**
   * Retrieves items from the group and its sub-groups based on the provided options.
   *
   * @param options - An optional object containing filtering options.
   * @param options.type - An optional type to filter the items. If provided, only items of this type will be returned.
   * @param options.ignoreGroups - If true, sub-groups will not be included in the result.
   *
   * @returns An array of items that meet the specified criteria.
   * If the `type` parameter is provided, the returned items will be of the specified type.
   * If the `ignoreGroups` parameter is true, the returned items will not include sub-group items.
   */
  public getItems(options?: { type?: typeof ItemEntity; ignoreGroups?: boolean }): InstanceType<typeof ItemEntity>[] {
    const items: InstanceType<typeof ItemEntity>[] = [];

    for (const item of this.items) {
      if (item instanceof ItemGroupEntity) {
        items.push(...item.getItems(options) as InstanceType<typeof ItemEntity>[]);
        
        if (options?.ignoreGroups) {
          continue;
        }
      } else if (options?.type && !(item instanceof options.type)) {
        continue;
      }
      items.push(item);
    }
    return items;
  }

  /**
   * Adds an item to the group.
   * If `afterItemId` is provided, the item will be inserted after the specified item in the group.
   * If `afterItemId` is not provided, the item will be appended to the end of the group.
   *
   * @param item - The item to add to the group.
   * @param afterItemId - (Optional) The id of the item after which the new item should be inserted.
   *
   * @throws {Error} - If the item is not supported by this group.
   * @throws {Error} - If `afterItemId` is provided and not found in the group.
   */
  public addItem(item: ItemEntity, afterItemId?: string): void {

    if (!this.isSupportedItem(item)) {
      throw new Error(`Item ${item.id} is not supported by this group`);
    }

    if (afterItemId) {
      const index = this._items.findIndex(item => item.id === afterItemId);
      if (index === -1) {
        throw new Error(`Item ${afterItemId} not found in group ${this.id}`);
      }
      this._items.splice(index + 1, 0, item);
    } else {
      this._items.push(item);
    }
    item.parent = this;
  }

  /**
   * Removes an item from the group based on its id.
   *
   * @param itemId - The id of the item to remove from the group.
   *
   * @throws {Error} - If the item with the specified id is not found in the group.
   */
  public removeItem(itemId: string): void {
    const index = this._items.findIndex(item => item.id === itemId);
    if (index === -1) {
      throw new Error(`Item ${itemId} not found in group ${this.id}`);
    }
    this._items.splice(index, 1);
  }

  /**
   * Clears all items from the group.
   *
   * This method removes all items from the group, effectively emptying the group.
   *
   * @returns {void}
   *
   * @throws {Error} - If the group is read-only.
   */
  public clearItems(): void {
    this._items = [];
  }

  /**
   * Checks if the provided item is supported by the group based on its category.
   *
   * @param item - The item to check for support.
   *
   * @returns `true` if the item is supported by the group, `false` otherwise.
   *
   * @throws {Error} - If the item's category is not set.
   *
   * @remarks
   * This method uses the `isItemInstanceOfCategory` function to determine if the item's category matches the group's `contains` property.
   *
   * @example
   * ```typescript
   * const group = new ItemGroupEntity({ id: "1", name: "Group A", contains: ItemCategory.PIPE });
   * const pipe = new PipeEntity({ id: "2", name: "Pipe 1" });
   * const isSupported = group.isSupportedItem(pipe); // Returns true
   * ```
   */
  public isSupportedItem(item: ItemEntity): boolean {
    return isItemInstanceOfCategory(item, this.contains);
  }

  /**
   * Converts the item group entity to a JSON object.
   *
   * This method overrides the `toJSON` method from the parent `ItemEntity` class.
   * It creates a JSON representation of the item group entity, including its properties and nested items.
   *
   * @returns A JSON object representing the item group entity.
   *
   * @remarks
   * The JSON object includes the following properties:
   * - `id`: The unique identifier of the item group.
   * - `name`: The name of the item group.
   * - `contains`: The category of items that the group can contain.
   * - `expanded`: A boolean indicating whether the group is expanded or collapsed.
   * - `_items`: An array of JSON objects representing the nested items in the group.
   *
   * @example
   * ```typescript
   * const group = new ItemGroupEntity({ id: "1", name: "Group A", contains: ItemCategory.PIPE });
   * const pipe = new PipeEntity({ id: "2", name: "Pipe 1" });
   * group.addItem(pipe);
   * const json = group.toJSON();
   * // json = {
   * //   id: "1",
   * //   name: "Group A",
   * //   contains: ItemCategory.PIPE,
   * //   expanded: true,
   * //   _items: [
   * //     {
   * //       id: "2",
   * //       name: "Pipe 1",
   * //       category: ItemCategory.PIPE,
   * //       // ... other properties of the pipe entity
   * //     }
   * //   ]
   * // }
   * ```
   */
  public override toJSON(): Record<string, any> {
    const json = super.toJSON();
    json["name"] = this.name;
    json["contains"] = this.contains;
    json["expanded"] = this.expanded;
    json["_items"] = this.items.map(item => item.toJSON());
    return json;
  }
}