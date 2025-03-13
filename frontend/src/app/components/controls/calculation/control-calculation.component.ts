import { Component, OnDestroy, OnInit } from '@angular/core';
import { I18NEXT_SCOPE, I18NextModule, I18NextPipe } from 'angular-i18next';
import { ItemService } from '../../../services/item/item.service';
import { PrimeTemplate } from 'primeng/api';
import { ProgressIndicatorService } from 'src/app/services/progress-indicator/progress-indicator.service';
import { ItemGroupEntity } from '@common/entities/item/items/group.entity';
import Color from "color";
import { ItemCategory, ItemEntity } from '@common/entities/item/item.entity';
import { instanciateItem, ITEM_CATEGORY_TO_ICON } from '@common/entities/item/resolvers/item.resolver';
import itemStructureResolver from '@common/entities/item/resolvers/item-structure';
import { isItemPrintColumn, ItemStructure } from '@common/interfaces/items/item-structure.interface';
import { TableRowCollapseEvent, TableRowExpandEvent, TableModule } from 'primeng/table';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { ControlCalculationCellComponent } from './cell/control-calculation-cell.component';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InplaceModule } from 'primeng/inplace';
import { ButtonDirective, Button } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { NgTemplateOutlet, AsyncPipe, CurrencyPipe, DecimalPipe, NgStyle, NgClass, NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import * as SettingsSelectors from 'src/app/store/selectors/settings.selector';
import { Settings } from 'src/app/interfaces/settings.interface';
import { GetItemAttributePipe } from 'src/app/pipes/get-item-attribute.pipe';
import { AttributeName } from '@common/interfaces/attribute.interface';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TimelineModule } from 'primeng/timeline';
import { DividerModule } from 'primeng/divider';
import { environment } from 'src/environments/environment';
import { MaterialFactorID } from '@common/constants/calculation.const';
import { UnitPriceService } from 'src/app/services/unit-price/unit-price.service';
import { RouterModule } from '@angular/router';


@Component({
    selector: 'app-control-calculation',
    templateUrl: './control-calculation.component.html',
    styleUrls: ['./control-calculation.component.scss'],
    providers: [{
      provide: I18NEXT_SCOPE,
      useValue: 'components.controls.calculation'
    }],
    standalone: true,
    imports: [
      RouterModule,
      ProgressBarModule,
      TableModule,
      PrimeTemplate,
      TooltipModule,
      ButtonDirective,
      InplaceModule,
      FormsModule,
      InputTextModule,
      Button,
      NgTemplateOutlet,
      ControlCalculationCellComponent,
      DecimalPipe,
      I18NextModule,
      AsyncPipe,
      GetItemAttributePipe,
      ProgressSpinnerModule,
      OverlayPanelModule,
      TimelineModule,
      DividerModule,
      NgStyle,
      NgClass,
      NgIf
    ]
})
export class ControlCalculationComponent implements OnInit, OnDestroy {
  
  protected readonly showDocs = environment.showDocs;
  protected readonly AttributeName = AttributeName;
  protected readonly ItemCategory = ItemCategory;
  protected readonly ITEM_CATEGORY_TO_ICON = ITEM_CATEGORY_TO_ICON;
  protected readonly MaterialFactorID = MaterialFactorID;
  protected readonly Array = Array;
  protected readonly Math = Math;
  protected readonly Number = Number;

  protected readonly version = environment.version;

  protected selectedItem: ItemEntity | null = null;
  protected settings: Observable<Settings> | null = null;

  private subscriptions = new Subscription();

  private structureCache = new Map<ItemCategory, ItemStructure>();

  protected messages = [{
    severity: 'success',
    summary: 'Success',
    detail: 'Message Content',
  }]

  /**
   * The constructor of the ControlCalculationComponent.
   * @param itemService - The ItemService used to access the items.
   * @param progressIndicatorService - The ProgressIndicatorService used to access the progress indicator.
   * @param store - The Store used to access the settings.
   * @param i18NextPipe - The I18NextPipe used to translate the component.
   * @param unitPriceService - The UnitPriceService used to access the unit prices.
   */
  constructor(
    protected itemService: ItemService,
    protected progressIndicatorService: ProgressIndicatorService,
    protected store: Store,
    private i18NextPipe: I18NextPipe,
    protected unitPriceService: UnitPriceService
  ) { }

/**
 * Lifecycle hook that is called after data-bound properties of a directive are initialized.
 * Initializes the settings observable by selecting the applied settings from the store.
 */
  ngOnInit(): void {
    this.settings = this.store.select(SettingsSelectors.selectApplied);
    console.log("version-------------->", this.version, this.showDocs);
  }

/**
 * Lifecycle hook that is called when a directive, pipe, or service is destroyed.
 * Unsubscribes from all subscriptions to avoid memory leaks.
 */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Calculates and returns a hexadecimal color code based on the given level.
   * The color is generated by lightening a base color (#006a34) for each level.
   *
   * @param level - The level for which the color needs to be calculated.
   * @returns A hexadecimal color code representing the calculated color.
   */
  protected getColorByLevel(level: number): string {
    let color = new Color("#006a34");
    for (let i = 0; i < level-1; i++) {
      color = color.lighten(0.25);
    }
    return color.hex();
  }

  /**
   * Retrieves the item structure based on the given item category.
   * If the structure is already cached, it returns the cached version.
   * Otherwise, it resolves the structure using the itemStructureResolver function,
   * filters out print columns, and caches the result for future use.
   *
   * @param itemCategory - The category for which the item structure needs to be retrieved.
   * @returns The resolved item structure for the given category.
   */
  protected getStructureByCategory(itemCategory: ItemCategory): ItemStructure {
    if (this.structureCache.has(itemCategory)) {
      return this.structureCache.get(itemCategory) as ItemStructure;
    }

    const structure = itemStructureResolver(itemCategory);
    structure.columns = structure.columns.filter(c => !isItemPrintColumn(c));
    this.structureCache.set(itemCategory, structure);
    return structure;
  }

  /**
   * Retrieves a map of expanded item keys based on the given item group entity.
   *
   * @param itemGroupEntity - The item group entity for which to retrieve expanded item keys.
   * @returns A map of item keys and their corresponding expansion state (true for expanded, false for collapsed).
   *
   * @remarks
   * This function iterates through the items of the given item group entity and checks if each item is an instance of
   * `ItemGroupEntity`. If it is, the function adds the item's ID as a key to the `expandedItemKeys` map and sets its value
   * to the item's `expanded` property.
   *
   * The function returns the `expandedItemKeys` map, which can be used to track the expansion state of item groups in a
   * hierarchical structure.
   */
  protected getExpandedItemKeys(itemGroupEntity: ItemEntity): { [key: string]: boolean } {
    const expandedItemKeys: { [key: string]: boolean } = {};
    if (itemGroupEntity instanceof ItemGroupEntity) {
      itemGroupEntity.items.forEach(item => {
        if (item instanceof ItemGroupEntity) {
          expandedItemKeys[item.id] = item.expanded;
        }
      });
    }
    return expandedItemKeys;
  }

  /**
   * Toggles the expansion state of a specific item within a hierarchical structure.
   *
   * @param parent - The parent item entity that contains the item to be toggled.
   * @param event - The event object containing the data of the item being expanded or collapsed.
   *
   * @remarks
   * This function checks if the parent item is an instance of `ItemGroupEntity`. If it is, it retrieves the target item
   * using the `getItem` method of the parent item. If the target item is also an instance of `ItemGroupEntity`, it toggles
   * the `expanded` property of the target item.
   */
  protected toggleExpansionState(parent: ItemEntity, event: TableRowExpandEvent | TableRowCollapseEvent) {
    if (parent instanceof ItemGroupEntity) {
      const target = parent.getItem(event.data.id);
      if (target instanceof ItemGroupEntity) {
        target.expanded = !target.expanded;
      }
    }
  }

  /**
   * Adds a new item to the specified parent item group.
   *
   * @param parent - The parent item group entity to which the new item will be added.
   *
   * @remarks
   * This function creates a new item using the `instanciateItem` function with the category specified by the `contains` property
   * of the parent item group. The new item is then logged to the console and added to the parent item group using the
   * `addItem` method of the `itemService`.
   */
  protected addItem(parent: ItemGroupEntity): void {
    const newItem = instanciateItem({ category: parent.contains });
    console.log(newItem);
    this.itemService.addItem(newItem, parent);
  }

  /**
   * Removes the specified item from the item service.
   *
   * @param item - The item entity to be removed.
   *
   * @remarks
   * This function calls the `removeItem` method of the `itemService` to remove the given item from the application's data.
   * It is assumed that the `itemService` is properly initialized and has the necessary methods to handle item removal.
   *
   * @returns {void}
   */
  protected removeItem(item: ItemEntity): void {
    this.itemService.removeItem(item);
  }

  /**
   * Duplicates the specified item in the item service.
   *
   * @param item - The item entity to be duplicated. This item should be an instance of `ItemEntity`.
   *
   * @remarks
   * This function calls the `duplicateItem` method of the `itemService` to create a copy of the given item.
   * The duplicated item will be added to the same parent item group as the original item.
   *
   * @returns {void}
   */
  protected duplicateItem(item: ItemEntity): void {
    this.itemService.duplicateItem(item);
  }
  
  /**
   * Handles the cell value change event for a specific item and item key.
   * This function updates the item's attributes, fixes columns, and calculates the item.
   *
   * @param item - The item entity for which the cell value has changed.
   * @param itemKey - The key of the attribute that has changed.
   *
   * @returns {Promise<void>} - A promise that resolves when the item has been updated and calculations have been performed.
   */
  protected async onCellValueChanged(item: ItemEntity, itemKey: string): Promise<void> {
    await this.itemService.fixColumns(item, itemKey);
    this.itemService.calculateItem(item);
  }

  /**
   * Handles the row change event in the table component.
   * This function persists the root item group in the item service.
   *
   * @returns {Promise<void>} - A promise that resolves when the root item group has been persisted.
   *
   * @remarks
   * This function is called whenever a row in the table is changed. It ensures that the application's data is synchronized
   * with the user's actions by persisting the root item group in the item service.
   *
   * The `persistRootGroup` method of the `itemService` is called to save the current state of the root item group.
   * This method should handle any necessary data manipulation or storage operations to ensure that the changes are persisted.
   */
  protected async onRowChange(): Promise<void> {
    this.itemService.persistRootGroup();
  }

  /**
   * Checks if an item entity has any errors associated with it.
   *
   * @param item - The item entity to check for errors.
   * @returns A boolean value indicating whether the item has errors (true) or not (false).
   *
   * @remarks
   * This function retrieves the errors attribute from the given item entity using the `getAttribute` method.
   * It then checks if the attribute value is an array and if it contains any elements.
   * If the attribute value is not an array or if it is empty, the function returns false.
   * Otherwise, it returns true, indicating that the item has errors.
   */
  protected itemHasErrors(item: ItemEntity): boolean {
    const errors = item.getAttribute(AttributeName.ERRORS) as any [] || [];
    return errors.length > 0;
  }

  /**
   * Checks if an item entity has any formulas associated with it.
   *
   * @param item - The item entity to check for formulas.
   * @returns A boolean value indicating whether the item has formulas (true) or not (false).
   *
   * @remarks
   * This function retrieves the formulas attribute from the given item entity using the `getAttribute` method.
   * It then checks if the attribute value is an array and if it contains any elements.
   * If the attribute value is not an array or if it is empty, the function returns false.
   * Otherwise, it returns true, indicating that the item has formulas.
   */
  protected itemHasFormulas(item: ItemEntity): boolean {
    const formulas = item.getAttribute(AttributeName.FORMULAS) as any [] || [];
    return formulas.length > 0;
  }

  /**
   * Filters formulas based on a required formula name.
   *
   * @param formulas - An array of formulas to be filtered.
   * @param requiredFormula - The name of the required formula to filter by.
   *
   * @returns An array of formulas that match the required formula name.
   *          If no formulas match or if the input arrays are empty, an empty array is returned.
   *
   * @remarks
   * This function filters an array of formulas based on a given required formula name.
   * It checks each formula's `formulas` property for the presence of the required formula name.
   * If a formula contains the required formula name, it is included in the returned array.
   * If no formulas match or if the input arrays are empty, an empty array is returned.
   */
  protected filterFormulas(formulas: any[], requiredFormula: string): any[] {
    if (!formulas || formulas.length === 0) {
      return [];
    }
    return formulas.filter(formula => typeof formula.formulas[requiredFormula] === 'string');
  }

  /**
   * Resolves calculation formulas by replacing parameter names with their corresponding translations.
   *
   * @param formula - The calculation formula to be resolved.
   * @returns The resolved calculation formula with parameter names replaced by their translations.
   *
   * @remarks
   * This function uses a regular expression to find parameter names in the given formula.
   * Each parameter name is then transformed using the `i18NextPipe` to retrieve its corresponding translation.
   * The translations are then used to replace the parameter names in the formula.
   *
   * If the `formula` parameter is `null` or `undefined`, the function returns `null` or `undefined` respectively.
   *
   * @example
   * ```typescript
   * const formula = 'Total Cost = Material Cost + Labor Cost + [Overhead Factor * Material Cost]';
   * const resolvedFormula = resolveCalculationFormula(formula);
   * console.log(resolvedFormula);
   * // Output: 'Total Cost = Material Cost + Labor Cost + [Overhead Factor * Material Cost]'
   * // with parameter names replaced by their translations
   * ```
   */
  protected resolveCalculationFormula(formula: string): string {
    return formula?.replace(/([a-zA-Z_]+[a-zA-Z_0-9]*)/g, (word) => {
      return this.i18NextPipe.transform(`components.controls.calculation.price-calculation.factors.parameter.${word.trim()}`);
    });
  }

  /**
   * Handles the row reorder event in the table component.
   * This function persists the root item group in the item service.
   *
   * @param event - The event object containing information about the row reorder operation.
   *
   * @returns {void} - This function does not return any value.
   *
   * @remarks
   * This function is called whenever a row in the table is reordered. It ensures that the application's data is synchronized
   * with the user's actions by persisting the root item group in the item service.
   *
   * The `persistRootGroup` method of the `itemService` is called to save the current state of the root item group.
   * This method should handle any necessary data manipulation or storage operations to ensure that the changes are persisted.
   */
  protected onRowReorder(event: any): void {
    this.itemService.persistRootGroup();
  }
}  
