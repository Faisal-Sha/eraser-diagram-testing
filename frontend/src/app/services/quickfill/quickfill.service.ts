import { Injectable } from "@angular/core";
import { DialogService } from "primeng/dynamicdialog";
import { I18NextPipe } from "angular-i18next";
import { DialogTemplateFooterComponent } from "../../components/dialog-templates/footer/dialog-template-footer.component";
import { ControlQuickfillComponent } from "../../components/controls/quickfill/control-quickfill.component";
import { SuggestionList, SuggestionService } from "../suggestion/suggestion.service";
import { ProgressIndicatorService } from "../progress-indicator/progress-indicator.service";
import { instanciateItem } from "@common/entities/item/resolvers/item.resolver";
import { ItemCategory } from "@common/entities/item/item.entity";
import { ItemPipeFittingEntity } from "@common/entities/item/items/pipe-fitting.entity";
import { GroupService } from "../group/group.service";
import { ItemGroupEntity } from "@common/entities/item/items/group.entity";
import { QuickfillGroup, QuickfillPart } from "src/app/interfaces/quickfill.interface";
import { ItemService } from "../item/item.service";
import { SYSTEM_PRESETS } from "src/app/consts/presets.const";


const SUGGESTION_SUGGESTION_MAP: { [key: string]: keyof QuickfillGroup } = {
  dn1: "dn",
  s1: "s",
  dn2: "dn",
  s2: "s"
};

@Injectable({
  providedIn: "root",
})
export class QuickfillService {
  /**
   * Creates an instance of QuickfillService.
   * @param dialogService The dialog service for showing the quickfill dialog.
   * @param suggestionService The suggestion service for generating suggestions
   * based on the user's input.
   * @param itemService The item service for creating new items.
   * @param progressIndicatorService The progress indicator service for showing
   * a progress indicator while the quickfill is running.
   * @param groupService The group service for creating new groups.
   * @param i18NextPipe The i18next pipe for translating strings.
   */
  constructor(
    private dialogService: DialogService,
    private suggestionService: SuggestionService,
    private itemService: ItemService,
    private progressIndicatorService: ProgressIndicatorService,
    private groupService: GroupService,
    private i18NextPipe: I18NextPipe
  ) {}

  /**
   * Shows a dialog for the user to input quickfill parameters and run the quickfill process.
   *
   * The dialog is opened using the DialogService, and it displays a ControlQuickfillComponent.
   * The component is configured with a header, width, footer template, and data.
   * The data includes buttons for confirming and canceling the quickfill process.
   *
   * When the user closes the dialog, the onClose subscription is triggered.
   * If the user confirms the quickfill process, the function retrieves the selected preset,
   * and then runs the quickfill using the provided groups and preset parts.
   */
  public showDialog(): void {
    const dialogRef = this.dialogService.open(ControlQuickfillComponent, {
      header: this.i18NextPipe.transform("components.controls.quickfill.title"),
      width: "920px",
      templates: {
        footer: DialogTemplateFooterComponent,
      },
      data: {
        buttons: {
          confirm: this.i18NextPipe.transform(
            "components.controls.quickfill.button.confirm"
          ),
          cancel: this.i18NextPipe.transform(
            "components.controls.quickfill.button.cancel"
          ),
        }
      },
    });

    dialogRef.onClose.subscribe((result?: { confirmed: boolean; data: any }) => {
      if (result?.confirmed) {
        const usedPresetId = result.data.model.usedPresetId;
        const availablePresets = [...SYSTEM_PRESETS, ...(result.data.model.presets ?? [])];

        const preset = availablePresets.find(preset => preset.id === usedPresetId);
        if (!preset) {
          return;
        }

        this.runQuickfill(result.data.model.groups, preset.parts);
      }
    });
  }

  /**
   * Runs the quickfill process for the given groups and parts.
   *
   * @param groups - The groups for which the quickfill process will be run.
   * @param parts - The parts that will be used in the quickfill process.
   *
   * @returns {Promise<void>} - A promise that resolves when the quickfill process is complete.
   */
  private async runQuickfill(groups: QuickfillGroup[], parts: QuickfillPart[]): Promise<void> {
    const target = (await this.groupService.selectGroup(
      ItemCategory.GROUP
    )) as ItemGroupEntity;
    
    this.progressIndicatorService.activate();
    
    await Promise.all(groups.map(group => this.createGroup(target, group, parts)));
    this.itemService.persistRootGroup();

    this.progressIndicatorService.deactivate();
  }

  /**
   * Creates a new group and populates it with quickfill items based on the given parameters.
   *
   * @param target - The parent group where the new group will be added.
   * @param group - The group data containing the name and length for quickfill items.
   * @param parts - The parts that will be used in the quickfill process.
   *
   * @returns {Promise<ItemGroupEntity>} - A promise that resolves with the newly created group.
   * The group is populated with quickfill items based on the given group and parts.
   */
  private async createGroup(target: ItemGroupEntity, group: QuickfillGroup, parts: QuickfillPart[]): Promise<ItemGroupEntity> {
    const itemGroup = instanciateItem({
      name: group.name,
      contains: ItemCategory.PIPEFITTING,
      category: ItemCategory.GROUP,
      typeId: "0",
    } as ItemGroupEntity) as ItemGroupEntity;
    target.addItem(itemGroup);

    const quickfillItems = await this.createQuickfillItems(group, parts);
    for (const quickfillItem of quickfillItems) {
      itemGroup.addItem(quickfillItem);
      this.itemService.calculateItem(quickfillItem, { persist: false });
    }
    return itemGroup;
  }

  /**
   * Creates quickfill items based on the given group and parts.
   *
   * @param group - The group data containing the name and length for quickfill items.
   * @param parts - The parts that will be used in the quickfill process.
   *
   * @returns {Promise<ItemPipeFittingEntity[]>} - A promise that resolves with an array of newly created quickfill items.
   * Each quickfill item is populated with the provided group and part data, and suggestions are selected for each item.
   */
  private async createQuickfillItems(group: QuickfillGroup, parts: QuickfillPart[]): Promise<ItemPipeFittingEntity[]> {
    const quickfillItems: ItemPipeFittingEntity[] = [];

    for (const part of parts) {
      if (!part.active) {
        continue;
      }

      let quantity = part.quantity * group.length / 10;
      quantity = Math.round(quantity * 10) / 10;

      const quickfillItem = instanciateItem({
        typeId: part.typeId,
        category: ItemCategory.PIPEFITTING,
        material: part.material,
        quantity
      } as ItemPipeFittingEntity) as ItemPipeFittingEntity;
      quickfillItems.push(quickfillItem);
      await this.selectSuggestions(quickfillItem, group, part);
    }

    return quickfillItems;
  }

  /**
   * Selects suggestions for the quickfill item based on the provided group and part data.
   *
   * @param quickfillItem - The item for which suggestions will be selected.
   * @param group - The group data containing the name and length for quickfill items.
   * @param part - The part that will be used in the quickfill process.
   *
   * @returns {Promise<void>} - A promise that resolves when the suggestions are selected for the quickfill item.
   *
   * @remarks
   * This function iterates through the available suggestion keys, checks if the column is available for the quickfill item,
   * retrieves column suggestions based on the quickfill item, group, and part data, selects the closest option, and assigns it to the quickfill item.
   */
  private async selectSuggestions(quickfillItem: ItemPipeFittingEntity, group: QuickfillGroup, part: QuickfillPart) {
    const suggestionKeys = Object.keys(SUGGESTION_SUGGESTION_MAP);

    for (const suggestionKey of suggestionKeys) {
      if (!quickfillItem.isColumnAvailable(suggestionKey)) {
        continue;
      }

      const columnSuggestions = await this.suggestionService.getColumnSuggestions(quickfillItem, suggestionKey, true);

      const targetValue = group[SUGGESTION_SUGGESTION_MAP[suggestionKey]];
      const closestOption = this.getClosestOption(columnSuggestions, targetValue);
      if (!closestOption) {
        continue;
      }
      (quickfillItem as any)[suggestionKey] = closestOption.value;
    }
  }

  /**
   * Finds the closest suggestion option from a given list based on a target value.
   * If the target value is numeric, the function calculates the closest numeric value.
   * If the target value is a string, the function finds the closest matching string.
   *
   * @param columnSuggestions - The list of suggestion options to search from.
   * @param targetValue - The target value to find the closest match for.
   *
   * @returns The closest suggestion option from the list, or `undefined` if no match is found.
   */
  private getClosestOption(columnSuggestions: SuggestionList, targetValue: any): SuggestionList[0] | undefined {
    let closestOption = columnSuggestions[0];

    const isNumeric = Number.isFinite(targetValue) && columnSuggestions.every(suggestion => Number.isFinite(suggestion.value));
    if (isNumeric) {
      if (!columnSuggestions || columnSuggestions.length < 1) {
        return undefined;
      }
      let closestDistance = Math.abs(targetValue - closestOption.value);

      for (const suggestion of columnSuggestions) {
        const distance = Math.abs(targetValue - suggestion.value);
        if (distance < closestDistance) {
          closestOption = suggestion;
          closestDistance = distance;
        }
      }
    } else {
      const targetValueString = targetValue.toString().toLowerCase();
      for (const suggestion of columnSuggestions) {
        if (suggestion.value.toString().toLowerCase() === targetValueString) {
          closestOption = suggestion;
          break;
        }
      }
    }
    return closestOption;
  }
}
