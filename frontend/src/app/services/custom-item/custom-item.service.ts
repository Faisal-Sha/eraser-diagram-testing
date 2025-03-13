import { Injectable } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { cloneDeep } from 'lodash';
import { I18NextPipe } from 'angular-i18next';
import { DialogTemplateFooterComponent } from 'src/app/components/dialog-templates/footer/dialog-template-footer.component';
import { CustomItem, CustomItemMode, Settings } from 'src/app/interfaces/settings.interface';
import { ItemCategory, ItemEntity, ItemUnit } from '@common/entities/item/item.entity';
import { SuggestionList } from '../suggestion/suggestion.service';
import { safeEquals } from '@common/utils/operations.util';
import { ItemPipeFittingEntity } from '@common/entities/item/items/pipe-fitting.entity';
import { ControlItemSpecificationEditComponent } from 'src/app/components/controls/settings/controls/custom-item/edit/custom-item-edit.component';
import { Store } from '@ngrx/store';
import * as SettingsSelectors from 'src/app/store/selectors/settings.selector';
import * as SettingsActions from 'src/app/store/actions/settings.action';
import { firstValueFrom } from 'rxjs';
import { Option } from '@common/interfaces/suggestion.interface';
import { DIAMETER_NOMINAL_LABELS } from '@common/constants/diameter-nominal.const';
import { CUSTOM_ITEM_PREFIX } from '@common/constants/custom-item.const';
import { generateNumericId } from 'src/app/utils/id-generator.util';

const STATIC_COLUMNS = ['typeId', 'category', 'quantity'];

@Injectable({
  providedIn: 'root'
})
export class CustomItemService {

  private temporarySettings?: Settings;
  private appliedSettings?: Settings;

  /**
   * @constructor
   * @param dialogService Service for opening dialogs
   * @param i18NextPipe Pipe for translating text
   * @param store Store for accessing and updating settings
   *
   * Subscribes to temporary and applied settings and stores them in local variables
   */
  constructor(
    private dialogService: DialogService,
    private i18NextPipe: I18NextPipe,
    private store: Store
  ) {
    this.store.select(SettingsSelectors.selectTemporary).subscribe(settings => this.temporarySettings = settings);
    this.store.select(SettingsSelectors.selectApplied).subscribe(settings => this.appliedSettings = settings);
  }

  /**
   * Opens a dialog to edit a custom item.
   *
   * @param customItem - The custom item to edit.
   *
   * This function first checks if temporary settings are available. If not, it logs an error and returns.
   * It then clones the custom item and retrieves the custom items from temporary settings.
   *
   * A dialog is opened using the `dialogService` with the `ControlItemSpecificationEditComponent` component.
   * The dialog header is set based on the mode of the custom item.
   * The dialog width is set to '80vw', and a footer template is provided.
   *
   * The dialog data includes buttons labels, the custom item, and the custom items.
   *
   * When the dialog is closed, it checks if the result is confirmed. If so, it updates the custom item in the temporary settings.
   */
  public showEditDialog(customItem: CustomItem): void {
    if (!this.temporarySettings) {
      console.error('Temporary settings not available');
      return;
    }

    customItem = cloneDeep(customItem);
    const customItems = this.temporarySettings.customItems;

    const dialogRef = this.dialogService.open(ControlItemSpecificationEditComponent, {
      header: this.i18NextPipe.transform(`components.controls.settings.controls.custom-item-edit.title.${customItem.mode === CustomItemMode.CUSTOM_ITEM ? 'custom' : 'override'}.edit`),
      width: '80vw',
      templates: {
        footer: DialogTemplateFooterComponent
      },
      data: {
        buttons: {
          confirm: this.i18NextPipe.transform('components.controls.settings.controls.custom-item-edit.button.confirm'),
          cancel: this.i18NextPipe.transform('components.controls.settings.controls.custom-item-edit.button.cancel')
        },
        customItem,
        customItems
      }
    });

    dialogRef.onClose.subscribe((result?: { confirmed: boolean; data: any }) => {
      if (result?.confirmed) {
        if (!this.temporarySettings) {
          console.error('Temporary settings not available');
          return;
        }

        const customItems = [...this.temporarySettings.customItems];
        const index = customItems.findIndex(item => item.id === customItem.id);
        customItems.splice(index, 1, result.data.customItem);

        this.store.dispatch(SettingsActions.update({ 
          settings: {
            ...this.temporarySettings,
            customItems
          }
        }));
      }
    });
  }

  /**
   * Opens a dialog to create a new custom item.
   *
   * @param mode - The mode of the custom item (CustomItemMode.CUSTOM_ITEM or CustomItemMode.OVERRIDE).
   * @param category - The category of the custom item.
   *
   * This function first checks if temporary settings are available. If not, it logs an error and returns.
   * It then clones the custom items from temporary settings.
   *
   * A dialog is opened using the `dialogService` with the `ControlItemSpecificationEditComponent` component.
   * The dialog header is set based on the mode of the custom item.
   * The dialog width is set to '80vw', and a footer template is provided.
   *
   * The dialog data includes buttons labels, a generated id, the mode, category, and the custom items.
   *
   * When the dialog is closed, it checks if the result is confirmed. If so, it updates the custom items in the temporary settings.
   */
  public showCreateDialog(mode: CustomItemMode, category: ItemCategory): void {
    if (!this.temporarySettings) {
      console.error('Temporary settings not available');
      return;
    }

    const customItems = this.temporarySettings.customItems;

    const id = generateNumericId(this.temporarySettings.customItems.map(customItem => customItem.id));
    const dialogRef = this.dialogService.open(ControlItemSpecificationEditComponent, {
      header: this.i18NextPipe.transform(`components.controls.settings.controls.custom-item-edit.title.${mode === CustomItemMode.CUSTOM_ITEM ? 'custom' : 'override'}.create`),
      width: '80vw',
      templates: {
        footer: DialogTemplateFooterComponent
      },
      data: {
        buttons: {
          confirm: this.i18NextPipe.transform('components.controls.settings.controls.custom-item-edit.button.confirm'),
          cancel: this.i18NextPipe.transform('components.controls.settings.controls.custom-item-edit.button.cancel')
        },
        id,
        mode,
        category,
        customItems
      }
    });

    dialogRef.onClose.subscribe(async (result?: { confirmed: boolean; data: any }) => {
      if (result?.confirmed) {
        const temporarySettings = await firstValueFrom(this.store.select(SettingsSelectors.selectTemporary));
        this.store.dispatch(SettingsActions.update({ 
          settings: {
            ...temporarySettings,
            customItems: [...temporarySettings.customItems, { ...result.data.customItem }]
          }
         }));
      }
    });
  }

  /**
   * Deletes the given custom item.
   *
   * @param item - The custom item to delete.
   *
   * @returns The deleted custom item.
   * This function first checks if temporary settings are available. If not, it logs an error and returns.
   * It then dispatches an action to update the settings by filtering out the deleted custom item.
   */
  public deleteCustomItem(item: CustomItem): void {
    if (!this.temporarySettings) {
      console.error('Temporary settings not available');
      return;
    }

    this.store.dispatch(SettingsActions.update({ 
      settings: {
        ...this.temporarySettings,
        customItems: this.temporarySettings.customItems.filter(customItem => customItem.id !== item.id)
      }
    }));
  }

  /**
   * Duplicates the given custom item.
   *
   * @param item - The custom item to duplicate.
   *
   * This function first checks if temporary settings are available. If not, it logs an error and returns.
   * It then clones the custom items from temporary settings.
   *
   * A duplicate custom item is created by cloning the original item and updating its id, typeId, name, and position in the custom items array.
   * The duplicate name is checked for uniqueness by appending a counter if necessary.
   *
   * The updated temporary settings are then dispatched to update the settings in the store.
   * @returns The duplicated custom item.
   */
  public duplicateCustomItem(item: CustomItem): void {
    if (!this.temporarySettings) {
      console.error('Temporary settings not available');
      return;
    }
    const customItems = [...this.temporarySettings.customItems];

    const duplicate = cloneDeep(item);
    duplicate.id = generateNumericId(customItems.map(customItem => customItem.id));
    duplicate.typeId = CUSTOM_ITEM_PREFIX + duplicate.id;
    duplicate.name = this.i18NextPipe.transform('components.controls.settings.controls.custom-item-edit.duplicate-name', { name: item.name });

    let duplicateCounter = 1;
    let name = duplicate.name;
    while (customItems.some(customItem => customItem.name === name)) {
      name = duplicate.name + ` (${duplicateCounter})`;
      duplicateCounter++;
    }
    duplicate.name = name;

    const index = customItems.findIndex(customItem => customItem.id === item.id);
    customItems.splice(index + 1, 0, duplicate);

    this.store.dispatch(SettingsActions.update({ 
      settings: {
        ...this.temporarySettings,
        customItems
      }
    }));
  }

  /**
   * Returns the custom suggestions for the given item and column.
   *
   * @param item - The item to get the custom suggestions for.
   * @param column - The column to get the custom suggestions for.
   * @param useTemporarySettings - Whether to use the temporary settings. Default is false.
   *
   * @returns The custom suggestions for the given item and column.
   *
   * This function first checks if temporary settings are available. If not, it logs an error and returns an empty array.
   * It then dispatches an action to update the settings by filtering out the deleted custom item.
   */
  public getCustomSuggestions(item: ItemEntity, column: string, useTemporarySettings = false): SuggestionList {
    const settings = useTemporarySettings ? this.temporarySettings : this.appliedSettings;
    if (!settings) {
      return [];
    }

    const customItems = settings.customItems ?? [];
    console.log(customItems);
    if (column === 'typeId') {
      return customItems.reduce((suggestions, customItem) => {
        if (customItem.typeId.startsWith(CUSTOM_ITEM_PREFIX) && customItem.category === item.category) {
          suggestions.push({
            value: customItem.typeId,
            label: customItem.name,
            group: 'custom'
          });
        }
        return suggestions;
      }, [] as SuggestionList);
    }

    let relevantColumnList = this.getRelevantColumnList(item).filter(relevantColumn => !STATIC_COLUMNS.includes(relevantColumn));
    const index = relevantColumnList.indexOf(column);
    if (index === -1) {
      return [];
    }
    relevantColumnList.splice(index);

    let specifications;
    if (item.typeId) {
      const customItem = customItems.find(customItem => customItem.typeId === item.typeId);
      specifications = customItem?.specifications ?? [];
    } else {
      specifications = customItems.reduce((acc, customItem) => {
        return acc.concat(customItem.specifications ?? []);
      }, [] as CustomItem['specifications']);
    }

    for (const relevantColumn of relevantColumnList) {
      specifications = specifications.filter(specifications => safeEquals(specifications['columns'][relevantColumn], item[relevantColumn as keyof ItemEntity]));
    }

    return specifications.map(specification => {
      let label = specification['columns'][column];
      if (column === 'dn1' || column === 'dn2') {
        const realDN = DIAMETER_NOMINAL_LABELS[label as number];
        if (typeof realDN === 'string') {
          label = realDN;
        }
      }
      return {
        value: specification['columns'][column],
        label,
        group: 'custom'
      } as Option<any>;
    }).filter(s => s.value !== null && typeof s.value !== 'undefined').filter((suggestion, index, suggestions) => {
      return suggestions.findIndex(s => safeEquals(s.value, suggestion.value)) === index;
    });
  }

  /**
   * Returns the relevant column list for the given item.
   *
   * @param item - The item to get the relevant column list for.
   *
   * @returns The relevant column list for the given item.
   *
   * If the applied settings are not available, the function returns the default relevant column list from the item.
   *
   * Otherwise, it filters the relevant column list based on the static columns and the specifications in the custom item.
   */
  public getRelevantColumnList(item: ItemEntity): string[] {
    if (!this.appliedSettings) {
      return item.getRelevantColumnList();
    }

    const customItems = this.appliedSettings.customItems ?? [];
    const customItem = customItems.find(customItem => customItem.typeId === item.typeId);
    if (!customItem) {
      return item.getRelevantColumnList();
    }

    let relevantColumnList = item.getRelevantColumnList();
    relevantColumnList = relevantColumnList.filter(relevantColumn => 
      STATIC_COLUMNS.includes(relevantColumn) || customItem.specifications?.some(specifications => specifications['columns'][relevantColumn])
    );
    return relevantColumnList;
  }

  /**
   * Returns whether the custom item column is available for the given item.
   *
   * @param item - The item to check.
   * @param column - The column to check.
   *
   * @returns Whether the custom item column is available for the given item.
   *
   * If the item is not custom, or the applied settings are not available, the function returns false.
   *
   * Otherwise, it filters the relevant column list based on the static columns and the specifications in the custom item.
   * It then checks if the specifications for the given column exist in the filtered list.
   * If they do, the function returns true; otherwise, it returns false.
   */
  public isCustomItemColumnAvailable(item: ItemEntity, column: string): boolean {
    if (!item.isCustom()) {
      return false;
    }
    if (!this.appliedSettings) {
      return false;
    }

    const customItems = this.appliedSettings.customItems ?? [];

    const customItem = customItems.find(customItem => customItem.typeId === item.typeId);
    if (!customItem) {
      return false;
    }

    if (STATIC_COLUMNS.includes(column)) {
      return true;
    }

    let relevantColumnList = this.getRelevantColumnList(item).filter(relevantColumn => !STATIC_COLUMNS.includes(relevantColumn));
    const index = relevantColumnList.indexOf(column);
    if (index === -1) {
      return false;
    }
    relevantColumnList.splice(index + 1);

    let specifications = [...(customItem.specifications ?? [])];
    for (const relevantColumn of relevantColumnList) {
      if (relevantColumn === column) {
        return specifications.some(s => s['columns'][column]);
      }

      if (item[relevantColumn as keyof ItemEntity] === null || typeof item[relevantColumn as keyof ItemEntity] === 'undefined') {
        return false;
      }

      specifications = specifications.filter(specifications => safeEquals(specifications['columns'][relevantColumn], item[relevantColumn as keyof ItemEntity]));
      const someSpecificationsAvailable = specifications.some(s => s['columns'][relevantColumn]);
      if (!someSpecificationsAvailable) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns the custom item and specification for the given item.
   *
   * @param item - The item to get the custom item and specification for.
   *
   * @returns An object containing the custom item and its corresponding specification,
   * or `undefined` if no matching custom item and specification are found.
   *
   * If the applied settings are not available, the function returns `undefined`.
   *
   * The function first filters the custom items based on the item's typeId.
   * Then, it finds the specifications that match the item's relevant columns.
   * If a matching custom item and specification are found, the function returns them.
   * Otherwise, it returns `undefined`.
   */
  public findCustomItemSpecification(item: ItemEntity): { customItem: CustomItem, specification: CustomItem['specifications'][0] } | undefined {
    if (!this.appliedSettings) {
      return;
    }
    const customItems = this.appliedSettings.customItems ?? [];

    const relevantColumnList = this.getRelevantColumnList(item).filter(relevantColumn => !STATIC_COLUMNS.includes(relevantColumn));
    const customItem = customItems.find(customItem => {
      if (customItem.typeId !== item.typeId) {
        return false;
      }

      const specifications = customItem.specifications ?? [];
      return specifications.some(specifications => {
        return relevantColumnList.every(relevantColumn => {
          return safeEquals(specifications['columns'][relevantColumn], item[relevantColumn as keyof ItemEntity]);
        });
      });
    });

    if (!customItem) {
      return;
    }

    const specifications = customItem.specifications ?? [];
    const specification = specifications.find(specifications => {
      return relevantColumnList.every(relevantColumn => {
        return safeEquals(specifications['columns'][relevantColumn], item[relevantColumn as keyof ItemEntity]);
      });
    });

    if (!specification) {
      return;
    }

    return { customItem, specification };
  }

  /**
   * Checks if the given item is a custom item.
   *
   * @param item - The item to check.
   *
   * @returns A boolean indicating whether the item is a custom item.
   * If the item is marked as custom, the function returns true.
   * Otherwise, it checks if a matching custom item and specification are found in the applied settings.
   * If a matching custom item and specification are found, the function returns true; otherwise, it returns false.
   */
  public isCustomItem(item: ItemEntity): boolean {
    if (item.isCustom()) {
      return true;
    }

    const customItemSpecification = this.findCustomItemSpecification(item);
    return !!customItemSpecification;
  }

  /**
   * Checks if the given item is a custom item.
   *
   * @param item - The item to check.
   *
   * @returns A boolean indicating whether the item is a custom item.
   * If the item is marked as custom, the function returns true.
   * Otherwise, it checks if a matching custom item and specification are found in the applied settings.
   * If a matching custom item and specification are found, the function returns true; otherwise, it returns false.
   */
  public isCustomItemComplete(item: ItemEntity): boolean {
    if (!this.appliedSettings) {
      return false;
    }

    const customItems = this.appliedSettings.customItems ?? [];
    const customItem = customItems.find(customItem => customItem.typeId === item.typeId);
    if (!customItem) {
      return false;
    }

    if (!item.typeId || !item.category || !(item as ItemPipeFittingEntity).quantity) {
      return false;
    }

    const relevantColumnList = item.getRelevantColumnList().filter(relevantColumn => !STATIC_COLUMNS.includes(relevantColumn));
    let specifications = customItem.specifications ?? [];

    for (const relevantColumn of relevantColumnList) {
      specifications = specifications.filter(specifications => safeEquals(specifications['columns'][relevantColumn], item[relevantColumn as keyof ItemEntity]));

      const someSpecificationsAvailable = specifications.some(specifications => specifications['columns'][relevantColumn]);
      if (someSpecificationsAvailable && !item[relevantColumn as keyof ItemEntity]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns the unit of the custom item.
   *
   * @param item - The item to get the unit for.
   *
   * @returns The unit of the custom item.
   * If the applied settings are not available, the function returns ItemUnit.NONE.
   * Otherwise, it finds the custom item in the applied settings based on the item's typeId.
   * If a matching custom item is found, the function returns the unit of the custom item.
   * If no matching custom item is found, the function returns ItemUnit.NONE.
   */
  public getUnit(item: ItemEntity): ItemUnit {
    if (!this.appliedSettings) {
      return ItemUnit.NONE;
    }

    const customItems = this.appliedSettings.customItems ?? [];
    const customItem = customItems.find(customItem => customItem.typeId === item.typeId);

    if (!customItem) {
      return ItemUnit.NONE;
    }
    return customItem.unit;
  }
}
