import { CalculationRequest, CalculationResponse } from '@common/interfaces/calculation.interface';
import { Inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { I18NEXT_SERVICE, I18NextPipe, I18NextService } from 'angular-i18next';
import { SuggestionService } from '../suggestion/suggestion.service';
import { ItemGroupEntity } from '@common/entities/item/items/group.entity';
import { ItemCategory, ItemEntity, ItemUnit } from '@common/entities/item/item.entity';
import { instanciateItem } from '@common/entities/item/resolvers/item.resolver';
import { Store } from '@ngrx/store';
import * as ItemSelectors from '../../store/selectors/item.selector';
import * as SettingsSelectors from '../../store/selectors/settings.selector';
import * as ItemActions from '../../store/actions/item.action';
import { CollectorServiceAbstract } from '../collector/collector.abstract';
import { CustomItemService } from '../custom-item/custom-item.service';
import { AttributeName } from '@common/interfaces/attribute.interface';
import { BehaviorSubject, concatMap, debounceTime, filter, firstValueFrom, merge, skip, switchMap } from 'rxjs';
import { FormulaService } from '../formula/formula.service';
import { ItemPipeFittingEntity } from '@common/entities/item/items/pipe-fitting.entity';
import { cloneDeep } from 'lodash';
import { MaterialFactorID } from '@common/constants/calculation.const';
import itemStructureResolver from '@common/entities/item/resolvers/item-structure';
import { Settings } from 'src/app/interfaces/settings.interface';
import { expandGroupCalculation, expandItemCalculation } from 'src/app/utils/expand-calculation.util';

@Injectable({
  providedIn: "root",
})
export class ItemService extends CollectorServiceAbstract<ItemEntity, CalculationResponse['items'][0], CalculationRequest, CalculationResponse> {
  protected readonly ENDPOINT = environment.apiUrl + "/calculation";

  private _rootGroup: ItemGroupEntity | null = null;
  /**
   * Returns the current root group.
   *
   * The root group is the top-level group that contains all other groups and items.
   * It is the root of the item tree.
   *
   * If the root group has not been set (i.e. it is null), this function will return null.
   *
   * @returns {ItemGroupEntity | null} The current root group, or null if no root group has been set.
   */
  public get rootGroup(): ItemGroupEntity | null {
    return this._rootGroup;
  }

/**
 * Clears the root group by setting it to null.
 *
 * @remarks
 * This function is used to clear the current root group from memory.
 * It sets the `_rootGroup` property to `null`, effectively removing the reference to the current root group.
 * This can be used to reset the state of the application when the root group is no longer needed.
 *
 * @returns {void}
 */

  public clearRootGroup(): void {
    this._rootGroup = null;
  }

  private settings!: Settings;

  private rootGroup$ = new BehaviorSubject<ItemGroupEntity | null>(null);
  private settingsChange$ = new BehaviorSubject<void>(undefined);
  
  /**
   * The constructor for the item service.
   *
   * The constructor sets up the initial state of the item service by:
   * - Setting up the root group from the stored root group.
   * - Listening to changes in the root group and firing a recalculation.
   * - Listening to changes in the settings and firing a recalculation.
   * - Combining the two streams and firing a recalculation when either changes.
   * - Subscribing to the combined stream and triggering a calculation when a new value is emitted.
   */
  constructor(
    httpClient: HttpClient,
    @Inject(I18NEXT_SERVICE) i18nService: I18NextService,
    private i18NextPipe: I18NextPipe,
    private suggestionService: SuggestionService,
    private store: Store,
    private customItemService: CustomItemService,
    private formulaService: FormulaService
  ) {
    super(httpClient, i18nService);
    this.store.select(ItemSelectors.selectRootGroupJSON).subscribe((rootGroup) => {
      if (!this._rootGroup) {
        this._rootGroup = new ItemGroupEntity({
          id: 'root',
          ...rootGroup
        });
        this.rootGroup$.next(this._rootGroup);
      }
    });

    this.store.select(SettingsSelectors.selectApplied).pipe(skip(1)).subscribe(() => {
      this.settingsChange$.next(); // Trigger recalculation on settings change
    });

    this.store.select(SettingsSelectors.selectApplied).subscribe((settings) => {
      this.settings = settings;
    });

    // Combine both streams and ensure only the latest calculation runs
    merge(
      this.rootGroup$,
      this.settingsChange$.pipe(switchMap(() => this.rootGroup$))
    ).pipe(
      filter(rootGroup => !!rootGroup), // Ensure rootGroup is not null
      debounceTime(50), // Debounce to handle rapid changes
      concatMap((rootGroup) => {
        return this.calculateGroupItems(rootGroup!, { persist: false });
      })
    ).subscribe();
  }

  /**
   * Retrieves the unit of measurement for a given item.
   *
   * @param item - The item for which to retrieve the unit of measurement.
   * @returns The unit of measurement for the given item.
   *
   * If the item is a custom item, the unit of measurement is retrieved from the custom item service.
   * Otherwise, the unit of measurement is retrieved directly from the item.
   */
  public getUnit(item: ItemEntity): ItemUnit {
    if (item.isCustom()) {
      return this.customItemService.getUnit(item);
    }
    return item.getUnit();
  }

  /**
   * Fixes the columns of a given item based on certain conditions.
   *
   * @param item - The item for which to fix the columns.
   * @param afterColumn - Optional: The column after which to fix the columns. If not provided, all columns will be fixed.
   * @returns void
   *
   * The function sets the 'IS_PROCESSING' attribute of the item to true before fixing the columns.
   * It then retrieves the relevant columns based on the item's category.
   * The function iterates over the relevant columns and fixes them based on certain conditions.
   * If the 'afterColumn' parameter is provided, only the columns after the specified column will be fixed.
   * The function sets the 'IS_PROCESSING' attribute of the item to false after fixing the columns.
   */
  public async fixColumns(
    item: ItemEntity,
    afterColumn?: string
  ): Promise<void> {
    item.setAttribute(AttributeName.IS_PROCESSING, true);

    const relevantColumns = this.customItemService.isCustomItem(item) ? this.customItemService.getRelevantColumnList(item) : item.getRelevantColumnList();
    const fixColumns = (afterColumn ? relevantColumns.slice(relevantColumns.findIndex((c) => c === afterColumn) + 1) : relevantColumns).filter((column) => column !== "category");

    let isInvalid = false;
    for (let fixColumn of fixColumns) {
      if (fixColumn === "quantity") {
        continue;
      }

      if (isInvalid) {
        (item as any)[fixColumn] = null;
        continue;
      }

      const suggestions = await this.suggestionService.getColumnSuggestions(item, fixColumn, true);
      const suggestion = suggestions.find((suggestion) => suggestion.value === (item as any)[fixColumn]);
      if (suggestion) {
        continue;
      }

      if (suggestions.length === 1 && (item as any)[fixColumn] === null) {
        (item as any)[fixColumn] = suggestions[0].value as any;
        continue;
      }

      (item as any)[fixColumn] = null;
      isInvalid = true;
    }

    const structure = itemStructureResolver(item.category);
    for (let column of structure.columns) {
      if (relevantColumns.includes(column.itemKey)) {
        continue;
      }
      (item as any)[column.itemKey] = null;
    }

    item.setAttribute(AttributeName.IS_PROCESSING, false);
  }

  /**
   * Fixes the columns of all items within a given group.
   *
   * @param group - The group containing the items to fix the columns of.
   * @returns void
   *
   * This function iterates over all items within the given group.
   * If an item is an instance of `ItemGroupEntity`, the function recursively calls itself to fix the columns of the sub-group.
   * If an item is not an instance of `ItemGroupEntity`, the function calls the `fixColumns` method to fix the columns of the item.
   * The function awaits the completion of all asynchronous operations to ensure that the columns are fixed correctly.
   */
  public async fixColumnsOfGroup(
    group: ItemGroupEntity
  ): Promise<void> {
    const items = group.items;
    const promises = items.map((item) => {
      if (item instanceof ItemGroupEntity) {
        return this.fixColumnsOfGroup(item);
      }
      return this.fixColumns(item);
    });
    await Promise.all(promises);
  }

  /**
   * Adds an item to a group.
   *
   * @param item - The item to add. It should be a partial object of type T, where T extends ItemEntity.
   *               The item should include the 'category' and 'typeId' properties.
   * @param parentGroup - Optional. The parent group to add the item to. If not provided, the item will be added to the root group.
   *                      The parentGroup parameter should be an object with an 'id' property of type string.
   * @returns void
   *
   * If the root group is not defined, the function will return immediately.
   * Otherwise, it will create a new instance of the item using the 'instanciateItem' function.
   * If the parentGroup is not provided, the new item will be added to the root group.
   * If the parentGroup is provided, the function will find the corresponding group in the root group.
   * If the parentGroup is found, the new item will be added to the parentGroup.
   * If the new item is an instance of `ItemGroupEntity`, the function will calculate the group.
   * Otherwise, the function will calculate the parentGroup.
   * If any errors occur during the process, they will be thrown as exceptions.
   */
  public async addItem<T extends ItemEntity>(
    item: Partial<T> & Pick<T, "category"> & Pick<T, "typeId">,
    parentGroup?: Pick<ItemGroupEntity, "id">
  ): Promise<void> {
    if (!this.rootGroup) {
      return;
    }

    const newItem = instanciateItem(item);

    if (!parentGroup) {
      this.rootGroup.addItem(newItem);
      await this.calculateGroup(this.rootGroup);
      return;
    }

    const parentGroupItem = this.rootGroup.getItem(
      parentGroup.id,
      ItemGroupEntity
    );
    if (!parentGroupItem) {
      throw new Error("Parent group not found");
    }

    parentGroupItem.addItem(newItem);

    if (newItem instanceof ItemGroupEntity) {
      await this.calculateGroup(newItem);
    } else {
      await this.calculateGroup(parentGroupItem);
    }
  }

  /**
   * Removes an item from the root group.
   *
   * @param item - The item to remove. It should be an instance of `ItemEntity`.
   * @returns void
   *
   * If the root group is not defined or the item's parent is not an instance of `ItemGroupEntity`, the function will return immediately.
   * Otherwise, it will remove the item from its parent group and calculate the parent group.
   */
  public async removeItem(item: ItemEntity): Promise<void> {
    if (!this.rootGroup || !(item.parent instanceof ItemGroupEntity)) {
      return;
    }
    item.parent.removeItem(item.id);

    await this.calculateGroup(item.parent as ItemGroupEntity);
  }

  /**
   * Duplicates an item in the root group.
   *
   * @param item - The item to duplicate. It should be an instance of `ItemEntity`.
   * @returns void
   *
   * If the root group is not defined or the item's parent is not an instance of `ItemGroupEntity`, the function will return immediately.
   * Otherwise, it will create a new instance of the item using the 'instanciateItem' function with the 'duplicate' option set to true.
   * If the item is an instance of `ItemGroupEntity`, it will generate a new name for the duplicated group by appending a counter to the original name.
   * The new item will be added to the parent group of the original item, with the original item's ID as the reference ID.
   * If the new item is an instance of `ItemGroupEntity`, it will calculate the group.
   * Otherwise, it will calculate the parent group of the original item.
   */
  public async duplicateItem(item: ItemEntity): Promise<void> {
    if (!this.rootGroup || !(item.parent instanceof ItemGroupEntity)) {
      return;
    }

    let newItemName;
    if (item instanceof ItemGroupEntity) {
      newItemName = this.i18NextPipe.transform('components.controls.calculation.duplicate-name', { name: item.name });
      let duplicateCounter = 1;
      let name = newItemName;
      while (item.parent.items.some(item => item instanceof ItemGroupEntity && item.name === name)) {
        name = newItemName + ` (${duplicateCounter})`;
        duplicateCounter++;
      }
      newItemName = name;
    }

    const newItem = instanciateItem(item, true);
    item.parent.addItem(newItem, item.id);
    if (newItemName && newItem instanceof ItemGroupEntity) {
      newItem.name = newItemName;
    }

    await this.calculateGroup(item.parent as ItemGroupEntity);
  }

  /**
   * Calculates the item's attributes based on its category and custom item specification.
   * If the item is a custom item, it checks if the item is complete and finds the corresponding custom item specification.
   * It then calculates the item's attributes such as weight, effort hours, material price, and calculation factors.
   * If the item is not a custom item, it checks if the item is complete and sends a request to the server to calculate the item's attributes.
   * It applies the exchange rate to the material price attribute.
   * If the item is an instance of ItemPipeFittingEntity, it applies the formula service to calculate the item's attributes.
   * It refreshes the item's prices after applying the formula.
   * Finally, it sets the item's calculation status attributes and persists the root group if the persist option is true.
   *
   * @param item - The item to calculate.
   * @param options - Additional options for calculation.
   * @param options.persist - Whether to persist the root group after calculation. Default is true.
   * @param options.skipCalculateGroup - Whether to skip calculating the parent group after calculation. Default is false.
   * @returns void
   */
  public async calculateItem(item: ItemEntity, options?: { persist?: boolean, skipCalculateGroup?: boolean }): Promise<void> {
    const { persist = true, skipCalculateGroup = false } = options || {};

    if (item.category === ItemCategory.GROUP) {
      return;
    }
    item.deleteAttributes();

    if (this.customItemService.isCustomItem(item)) {
      if (!this.customItemService.isCustomItemComplete(item)) {
        if (persist) {
          this.persistRootGroup();
        }
        return;
      }

      const customItemSpecification = await this.customItemService.findCustomItemSpecification(item);
      if (!customItemSpecification) {
        if (persist) {
          this.persistRootGroup();
        }
        return;
      }

      this.markItemAsCalculating(item);

      const quantity = (item as any).quantity;
      const effordHours = customItemSpecification.specification['attributes'][AttributeName.EFFORD_HOURS];
      const materialPrice = customItemSpecification.specification['attributes'][AttributeName.PRICE_MATERIAL];
      const weight = customItemSpecification.specification['attributes'][AttributeName.WEIGHT];

      item.setAttribute(AttributeName.WEIGHT, weight);
      item.setAttribute(AttributeName.EFFORD_HOURS, quantity * effordHours);
      item.setAttribute(AttributeName.PRICE_MATERIAL, quantity * materialPrice);

      item.setAttribute(AttributeName.CALCULATION_MATERIAL, {
        factors: [
          {
            id: MaterialFactorID.CUSTOM_MATERIAL_PRICE,
            value: materialPrice
          },
          {
            id: 'QUANTITY',
            value: quantity
          },
          {
            id: 'WEIGHT',
            value: weight
          }
        ],
        formula: 'CUSTOM_MATERIAL_PRICE * QUANTITY'
      });

      item.setAttribute(AttributeName.CALCULATION_EFFORD_HOURS, {
        steps: [
          {
            name: MaterialFactorID.CUSTOM_EFFORD_HOURS,
            efford: effordHours,
            quantity: quantity,
            size: '-'
          }
        ]
      });

    } else {
      if (!item.isComplete()) {
        if (persist) {
          this.persistRootGroup();
        }
        return;
      }
      this.markItemAsCalculating(item);

      const calculatedItem = await this.sendQueuedRequest(item);
      item.attributes = cloneDeep(calculatedItem.attributes);

      // Apply exchange rate
      const exchangeRate = this.settings.currency.exchangeRate;
      const materialPrice = item.getAttribute(AttributeName.PRICE_MATERIAL);
      if (typeof materialPrice === 'number') {
        item.setAttribute(AttributeName.PRICE_MATERIAL, materialPrice * exchangeRate);
      }
    }

    if (item instanceof ItemPipeFittingEntity) {
      await this.formulaService.apply(item);
    }

    // prices getting refreshed after fomula usage
    await expandItemCalculation(item, this.store);

    item.setAttribute(AttributeName.IS_CALCULATING, false);
    item.setAttribute(AttributeName.IS_CALCULATED, true);

    if (!skipCalculateGroup && item.parent instanceof ItemGroupEntity) {
      await this.calculateGroup(item.parent, { persist });
    } else if (persist) {
      this.persistRootGroup();
    }
    return;
  }

  /**
   * Calculates the attributes of multiple items within a group.
   *
   * @param items - The items to calculate. Each item should be an instance of `ItemEntity`.
   * @param options - Additional options for calculation.
   * @param options.persist - Whether to persist the root group after calculation. Default is true.
   *
   * @returns void
   *
   * This function iterates over the provided items and calls the `calculateItem` method for each item.
   * It awaits the completion of all asynchronous operations to ensure that the items are calculated correctly.
   * If the `persist` option is true, it calls the `persistRootGroup` method to persist the root group.
   */
  public async calculateItems(items: ItemEntity[], options?: { persist?: boolean }): Promise<void> {
    const { persist = true } = options || {};
    const calculatedItems = [];
    for (const item of items) {
      calculatedItems.push(this.calculateItem(item, { persist: false }));
    }
    await Promise.all(calculatedItems);

    if (persist) {
      this.persistRootGroup();
    }
  }

  /**
   * Calculates the attributes of multiple items within a group.
   *
   * @param group - The group containing the items to calculate.
   * @param options - Additional options for calculation.
   * @param options.persist - Whether to persist the root group after calculation. Default is true.
   *
   * @returns void
   *
   * This function iterates over the provided items and calls the `calculateItem` method for each item.
   * It awaits the completion of all asynchronous operations to ensure that the items are calculated correctly.
   * If the `persist` option is true, it calls the `persistRootGroup` method to persist the root group.
   */
  public async calculateGroupItems(group: ItemGroupEntity, options?: { persist?: boolean }): Promise<void> {
    if (!group) {
      return;
    }

    const items = group.items;
    const promises = [];
    for (const item of items) {
      if (item instanceof ItemGroupEntity) {
        promises.push(this.calculateGroupItems(item, options));
      } else {
        promises.push(this.calculateItem(item, { skipCalculateGroup: true, persist: false }));
      }
    }
    await Promise.all(promises);
    await this.calculateGroup(group, options);
  }

  /**
   * Calculates the attributes of multiple items within a group.
   *
   * @param group - The group containing the items to calculate.
   * @param options - Additional options for calculation.
   * @param options.persist - Whether to persist the root group after calculation. Default is true.
   *
   * @returns {Promise<void>} - A promise that resolves when the calculation is complete.
   *
   * This function iterates over the provided items and calculates the attributes such as weight, effort hours, material price,
   * manufacturing price, assembly price, and total price. It also sets the calculation status attributes for the group and its items.
   * If the `persist` option is true, it calls the `persistRootGroup` method to persist the root group.
   */
  private async calculateGroup(group: ItemGroupEntity, options?: { persist?: boolean }): Promise<void> {
    if (!group) {
      return;
    }

    const { persist = true } = options || {};

    group.deleteAttributes();

    const items = group.items;

    const weight = items.reduce((acc, item) => {
      const itemWeight = item.getAttribute(AttributeName.WEIGHT);
      if (typeof itemWeight === 'number') {
        return acc + itemWeight;
      }
      return acc;
    }, 0);

    const effordHours = items.reduce((acc, item) => {
      const itemEffordHours = item.getAttribute(AttributeName.EFFORD_HOURS);
      if (typeof itemEffordHours === 'number') {
        return acc + itemEffordHours;
      }
      return acc;
    }, 0);

    const materialPrice = items.reduce((acc, item) => {
      const itemMaterialPrice = item.getAttribute(AttributeName.PRICE_MATERIAL);
      if (typeof itemMaterialPrice === 'number') {
        return acc + itemMaterialPrice;
      }
      return acc;
    }, 0);

    const manufacturingPrice = items.reduce((acc, item) => {
      const itemManufacturingPrice = item.getAttribute(AttributeName.PRICE_MANUFACTURING);
      if (typeof itemManufacturingPrice === 'number') {
        return acc + itemManufacturingPrice;
      }
      return acc;
    }, 0);

    const assemblyPrice = items.reduce((acc, item) => {
      const itemAssemblyPrice = item.getAttribute(AttributeName.PRICE_ASSEMBLY);
      if (typeof itemAssemblyPrice === 'number') {
        return acc + itemAssemblyPrice;
      }
      return acc;
    }, 0);

    const effordPrice = items.reduce((acc, item) => {
      const itemEffordPrice = item.getAttribute(AttributeName.PRICE_EFFORD);
      if (typeof itemEffordPrice === 'number') {
        return acc + itemEffordPrice;
      }
      return acc;
    }, 0);

    const totalPrice = items.reduce((acc, item) => {
      const itemTotalPrice = item.getAttribute(AttributeName.PRICE_TOTAL);
      if (typeof itemTotalPrice === 'number') {
        return acc + itemTotalPrice;
      }
      return acc;
    }, 0);

    group.setAttribute(AttributeName.WEIGHT, weight);
    group.setAttribute(AttributeName.EFFORD_HOURS, effordHours);

    group.setAttribute(AttributeName.PRICE_EFFORD, effordPrice);
    group.setAttribute(AttributeName.PRICE_MATERIAL, materialPrice);
    group.setAttribute(AttributeName.PRICE_MANUFACTURING, manufacturingPrice);
    group.setAttribute(AttributeName.PRICE_ASSEMBLY, assemblyPrice);
    group.setAttribute(AttributeName.PRICE_TOTAL, totalPrice);

    group.setAttribute(AttributeName.IS_CALCULATING, false);
    group.setAttribute(AttributeName.IS_CALCULATED, items.every(item => item.getAttribute(AttributeName.IS_CALCULATED) === true));

    await expandGroupCalculation(group);

    if (group.parent instanceof ItemGroupEntity) {
      await this.calculateGroup(group.parent, { persist });
    } else if (persist) {
      this.persistRootGroup();
    }
  }

  /**
   * Persists the root group to the application's state.
   * This function is called when the root group's attributes need to be saved.
   *
   * @remarks
   * This function checks if the root group exists before attempting to persist it.
   * If the root group does not exist, the function returns immediately without performing any action.
   * Otherwise, it dispatches an action to update the root group in the application's state.
   * The root group is converted to a JSON object before being dispatched.
   *
   * @returns {void}
   */
  public persistRootGroup(): void {
    if (!this.rootGroup) {
      return;
    }
    this.store.dispatch(ItemActions.updateRootGroup({ rootGroup: this.rootGroup.toJSON() }));
  }

  /**
   * Resets the root group by clearing all its items and recalculating the root group.
   *
   * @remarks
   * This function is used to prepare the application's state for a new calculation.
   * It checks if the root group exists before attempting to reset it.
   * If the root group does not exist, the function returns immediately without performing any action.
   * Otherwise, it clears all the items from the root group and recalculates the root group.
   *
   * @returns {Promise<void>} - A promise that resolves when the reset operation is complete.
   */
  public async reset(): Promise<void> {
    if (!this.rootGroup) {
      return;
    }

    this.rootGroup.clearItems();
    await this.calculateGroup(this.rootGroup);
  }

  /**
   * Marks the provided item and all its parent groups as calculating.
   * This function is used to indicate that the attributes of the item and its parent groups are currently being calculated.
   *
   * @param item - The item to mark as calculating. It should be an instance of `ItemEntity`.
   *
   * @returns {void}
   *
   * @remarks
   * This function iterates through the parent groups of the provided item and sets the `IS_CALCULATING` attribute to `true`.
   * This indicates that the attributes of the item and its parent groups are currently being calculated.
   * The function is called when the attributes of the item need to be calculated, and it helps to provide visual feedback to the user.
   */
  private markItemAsCalculating(item: ItemEntity): void {
    item.setAttribute(AttributeName.IS_CALCULATING, true);

    let parent = item.parent;
    while (parent) {
      parent.setAttribute(AttributeName.IS_CALCULATING, true);
      parent = parent.parent;
    }
  }

  /**
   * Generates a request body for calculating item attributes.
   *
   * @param items - The items for which to generate the request body.
   * Each item should be an instance of `ItemEntity`.
   *
   * @returns {CalculationRequest} - The request body containing the items.
   *
   * @remarks
   * This function is used to prepare the request body for calculating the attributes of the provided items.
   * It maps each item to a simplified object containing only the necessary information for calculation.
   * The request body is then returned as a `CalculationRequest` object.
   */
  protected override generateRequestBody(items: ItemEntity[]): CalculationRequest {
    return {
      items
    }
  }

  /**
   * Parses the items from the provided calculation response.
   *
   * @param response - The calculation response containing the items.
   *
   * @returns {CalculationResponse['items']} - The parsed items from the response.
   *
   * @remarks
   * This function extracts the items from the provided calculation response and returns them.
   * It is used to process the response data and obtain the relevant items for further processing.
   */
  protected override parseItemsFromResponse(response: CalculationResponse): CalculationResponse['items'] {
    return response.items;
  }

  /**
   * Determines whether the provided request item matches the response item based on their IDs.
   *
   * @param requestItem - The item from the calculation request.
   * @param responseItem - The item from the calculation response.
   *
   * @returns {boolean} - A boolean indicating whether the request item matches the response item.
   * If the IDs of the request item and the response item are equal, the function returns `true`.
   * Otherwise, it returns `false`.
   */
  protected override matchItems(requestItem: ItemEntity, responseItem: ItemEntity): boolean {
    return requestItem.id === responseItem.id;
  }

  /**
   * Generates a unique hash for the provided item based on its calculation attributes.
   *
   * @param item - The item for which to generate the hash. It should be an instance of `ItemEntity`.
   *
   * @returns {string} - The unique hash for the item.
   *
   * @remarks
   * This function is used to generate a unique hash for an item based on its calculation attributes.
   * It calls the `getCalculationHash` method of the item to obtain the hash, and then converts it to a JSON string.
   * The JSON string is returned as the unique hash for the item.
   */
  protected override generateItemHash(item: ItemEntity): string {
    return JSON.stringify(item.getCalculationHash());
  }

  /**
   * Determines whether the provided item's attributes can be cached.
   *
   * @param responseItem - The item to check for cacheability.
   * It should be an instance of `ItemEntity`.
   *
   * @returns {boolean} - A boolean indicating whether the item's attributes can be cached.
   * If the `IS_CALCULATED` attribute of the item is `true`, the function returns `true`.
   * Otherwise, it returns `false`.
   *
   * @remarks
   * This function is used to determine whether the attributes of a given item can be cached.
   * It checks the `IS_CALCULATED` attribute of the item to make this determination.
   * If the attribute is `true`, the function returns `true`, indicating that the item's attributes can be cached.
   * If the attribute is not `true`, the function returns `false`, indicating that the item's attributes cannot be cached.
   */
  protected override isCachable(responseItem: ItemEntity): boolean {
    const isCalculated = responseItem.attributes.find((attribute) => attribute.name === AttributeName.IS_CALCULATED)?.value as boolean ?? false;
    return isCalculated === true;
  }
}
