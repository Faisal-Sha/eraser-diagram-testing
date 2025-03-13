import { Component, Input } from '@angular/core';
import { I18NEXT_SCOPE, I18NextModule, I18NextPipe } from 'angular-i18next';
import { firstValueFrom, map } from 'rxjs';
import { CustomItem, CustomItemMode } from 'src/app/interfaces/settings.interface';
import { CustomItemService } from 'src/app/services/custom-item/custom-item.service';
import { TooltipModule } from 'primeng/tooltip';
import { Button } from 'primeng/button';
import { ConfirmationService, PrimeTemplate } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import * as SettingsSelectors from 'src/app/store/selectors/settings.selector';
import { ItemService } from 'src/app/services/item/item.service';
import * as QuickfillSelectors from "src/app/store/selectors/quickfill.selector";
import { ItemCategory, ItemEntity } from '@common/entities/item/item.entity';

@Component({
    selector: 'settings-control-custom-item-list',
    templateUrl: './control-custom-item-list.component.html',
    styleUrl: './control-custom-item-list.component.scss',
    providers: [{
        provide: I18NEXT_SCOPE,
        useValue: 'components.controls.settings.controls.custom-item-list'
    }],
    standalone: true,
    imports: [
      TableModule,
      PrimeTemplate,
      Button,
      TooltipModule,
      AsyncPipe,
      I18NextModule
    ]
})
export class ControlItemSpecificationListComponent {
  @Input() mode!: CustomItemMode;
  @Input() category!: ItemCategory;

  protected itemList = this.store.select(SettingsSelectors.selectTemporary).pipe(map(settings => settings?.customItems.filter(item => item.mode === this.mode && item.category === this.category) || []));
  protected CustomItemMode = CustomItemMode;

  /**
   * @constructor
   * @param store The store to use for getting temporary state.
   * @param itemService The item service to use for getting items.
   * @param customItemService The custom item service to use for creating, updating and deleting custom items.
   * @param confirmationService The confirmation service to use for asking user for confirmation.
   * @param i18NextPipe The i18Next pipe to use for translations.
   */
  constructor(
    private store: Store,
    private itemService: ItemService,
    protected customItemService: CustomItemService,
    protected confirmationService: ConfirmationService,
    private i18NextPipe: I18NextPipe
  ) { }

  /**
   * Opens the edit dialog for the specified custom item.
   *
   * @param customItem - The custom item for which to open the edit dialog.
   * This parameter is required and must be a valid instance of {@link CustomItem}.
   *
   * @returns {void} - This function does not return any value.
   *
   * @example
   * ```typescript
   * const customItem: CustomItem = { id: 1, name: 'Custom Item 1', mode: CustomItemMode.CUSTOM_ITEM, category: ItemCategory.ENGINE };
   * controlCustomItemListComponent.showEditDialog(customItem);
   * ```
   */
  showEditDialog(customItem: CustomItem): void {
    this.customItemService.showEditDialog(customItem);
  }

  /**
   * Deletes a custom item from the system.
   *
   * @param customItem - The custom item to be deleted.
   * This parameter is required and must be a valid instance of {@link CustomItem}.
   *
   * @returns {void} - This function does not return any value.
   *
   * @example
   * ```typescript
   * const customItem: CustomItem = { id: 1, name: 'Custom Item 1', mode: CustomItemMode.CUSTOM_ITEM, category: ItemCategory.ENGINE };
   * controlCustomItemListComponent.deleteCustomItem(customItem);
   * ```
   */
  deleteCustomItem(customItem: CustomItem): void {
    this.customItemService.deleteCustomItem(customItem);
  }

  /**
   * Duplicates a custom item in the system.
   *
   * @param customItem - The custom item to be duplicated.
   * This parameter is required and must be a valid instance of {@link CustomItem}.
   *
   * @returns {void} - This function does not return any value.
   *
   * @example
   * ```typescript
   * const customItem: CustomItem = { id: 1, name: 'Custom Item 1', mode: CustomItemMode.CUSTOM_ITEM, category: ItemCategory.ENGINE };
   * controlCustomItemListComponent.duplicateCustomItem(customItem);
   * ```
   */
  duplicateCustomItem(customItem: CustomItem): void {
    this.customItemService.duplicateCustomItem(customItem);
  }

  /**
   * Opens a confirmation dialog to delete a custom item.
   * If the custom item is of type {@link CustomItemMode.CUSTOM_ITEM}, it checks if the item is used in any quickfill presets or items.
   * If the item is used, it displays a disabled confirmation dialog.
   * If the item is not used, it displays a regular confirmation dialog.
   *
   * @param event - The event that triggered the confirmation dialog.
   * @param customItem - The custom item to be deleted.
   *
   * @returns {Promise<void>} - A promise that resolves when the user accepts the deletion.
   *
   * @example
   * ```typescript
   * const customItem: CustomItem = { id: 1, name: 'Custom Item 1', mode: CustomItemMode.CUSTOM_ITEM, category: ItemCategory.ENGINE };
   * await controlCustomItemListComponent.confirmDeleteCustomItem(event, customItem);
   * ```
   */
  protected async confirmDeleteCustomItem(event: Event, customItem: CustomItem): Promise<void> {

    if (customItem.mode === CustomItemMode.CUSTOM_ITEM) {

      const quickfill = await firstValueFrom(this.store.select(QuickfillSelectors.selectQuickfill));
      const rootGroup = this.itemService.rootGroup;

      const usedItems = rootGroup?.getItems({ ignoreGroups: true }).filter(item => item.typeId === customItem.typeId) || [];
      const usedInPresets = quickfill.presets.filter(preset => preset.parts.some(part => part.typeId === customItem.typeId));

      if (usedItems.length !== 0 || usedInPresets.length !== 0) {
        this.confirmationService.confirm({
          target: event.target as EventTarget,
          header: this.i18NextPipe.transform("components.controls.settings.controls.custom-item-list.confirmation.remove-disabled.title"),
          message: this.i18NextPipe.transform("components.controls.settings.controls.custom-item-list.confirmation.remove-disabled.message"),
          acceptLabel: this.i18NextPipe.transform("components.controls.settings.controls.custom-item-list.confirmation.remove-disabled.accept"),
          acceptButtonStyleClass: "p-button-secondary",
          icon: "pi pi-exclamation-triangle",
          rejectVisible: false,
        });
        return;
      }
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      header: this.i18NextPipe.transform("components.controls.settings.controls.custom-item-list.confirmation.remove.title"),
      message: this.i18NextPipe.transform("components.controls.settings.controls.custom-item-list.confirmation.remove.message"),
      acceptLabel: this.i18NextPipe.transform("components.controls.settings.controls.custom-item-list.confirmation.remove.accept"),
      rejectLabel: this.i18NextPipe.transform("components.controls.settings.controls.custom-item-list.confirmation.remove.reject"),
      acceptButtonStyleClass: "p-button-danger",
      rejectButtonStyleClass: "p-button-secondary",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        this.deleteCustomItem(customItem);
      },
      reject: () => {},
    });
  }
}
