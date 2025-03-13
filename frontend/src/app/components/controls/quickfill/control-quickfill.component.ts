import {
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { DynamicDialogConfig } from "primeng/dynamicdialog";
import { I18NEXT_SCOPE, I18NextModule, I18NextPipe } from "angular-i18next";
import { FormArray, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  Quickfill,
  UserPreset,
  QuickfillGroup,
  QuickfillPart,
  QuickfillPreset,
  SystemPreset
} from "src/app/interfaces/quickfill.interface";
import { BehaviorSubject, Subscription } from "rxjs";
import { SuggestionService } from "src/app/services/suggestion/suggestion.service";
import { DIAMETER_NOMINAL_LABELS } from "@common/constants/diameter-nominal.const";
import { CUSTOM_RULE_S } from "@common/constants/thk-suggestion.const";
import { fadeInOutAnimation } from "src/app/utils/animations.util";
import { ITEM_UNIT_LABEL_MAP, ItemCategory } from "@common/entities/item/item.entity";
import { instanciateItem } from "@common/entities/item/resolvers/item.resolver";
import { InputTextModule } from "primeng/inputtext";
import { InputSwitchModule } from "primeng/inputswitch";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { InputNumberModule } from "primeng/inputnumber";
import { InputGroupModule } from "primeng/inputgroup";
import { MessageModule } from "primeng/message";
import { DropdownModule } from "primeng/dropdown";
import { TableModule } from "primeng/table";
import { Button } from "primeng/button";
import { ChipModule } from "primeng/chip";
import { TooltipModule } from "primeng/tooltip";
import { NgClass, AsyncPipe, NgStyle } from "@angular/common";
import { AccordionModule } from "primeng/accordion";
import { Store } from "@ngrx/store";
import * as QuickfillSelectors from "src/app/store/selectors/quickfill.selector";
import * as QuickfillActions from "src/app/store/actions/quickfill.action";
import { SYSTEM_PRESETS } from "src/app/consts/presets.const";
import { QuickfillService } from "src/app/services/quickfill/quickfill.service";
import { ItemService } from "src/app/services/item/item.service";
import { InputService } from "src/app/services/input/input.service";
import { v4 as uuidv4 } from "uuid";
import { cloneDeep } from "lodash";
import { GetItemSuggestionsPipe } from "src/app/pipes/get-item-suggestions.pipe";
import { GetSuggestionLabelPipe } from "src/app/pipes/get-suggestion-label.pipe";
import { ItemPipeFittingEntity } from "@common/entities/item/items/pipe-fitting.entity";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { ConfirmationService } from "primeng/api";

interface PresetOption {
  id: string;
  label: string;
  editable: boolean;
}

// required for i18n because the scope is not inherited in dialogs
const SCOPE = "components.controls.quickfill";

@Component({
    selector: "app-control-quickfill",
    templateUrl: "./control-quickfill.component.html",
    styleUrls: ["./control-quickfill.component.scss"],
    providers: [{
      provide: I18NEXT_SCOPE,
      useValue: SCOPE,
    }],
    animations: [fadeInOutAnimation],
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        AccordionModule,
        NgClass,
        NgStyle,
        TooltipModule,
        ChipModule,
        Button,
        TableModule,
        DropdownModule,
        MessageModule,
        InputGroupModule,
        InputNumberModule,
        InputGroupAddonModule,
        InputSwitchModule,
        InputTextModule,
        AsyncPipe,
        I18NextModule,
        GetItemSuggestionsPipe,
        GetSuggestionLabelPipe,
        ProgressSpinnerModule
    ],
})
export class ControlQuickfillComponent implements OnInit, OnDestroy {
  protected ItemCategory = ItemCategory;

  protected form!: FormGroup;

  protected helpAccordionPartsActivated = false;
  protected helpAccordionGroupsActivated: boolean[] | undefined;

  protected presetOptions$: BehaviorSubject<PresetOption[]> = new BehaviorSubject<PresetOption[]>([]);
  protected dnOptions: { label: string; value: number }[] = [];
  protected sOptions: { label: string; value: number }[] = [];

  protected availablePresets: QuickfillPreset[] = [];

  protected selectedPreset: QuickfillPreset | null = null;
  protected selectedPresetEditable = false;

  protected subscriptions: Subscription = new Subscription();
  protected dummyItems: ItemPipeFittingEntity[] = [];

/**
 * Constructs an instance of `ControlQuickfillComponent`.
 * 
 * @param dialogConfig - Configuration for the dynamic dialog, enabling submissions and cancellations.
 * @param suggestionService - Service for providing suggestions based on user input.
 * @param store - The application's state management store.
 * @param quickFillService - Service to handle quick fill operations.
 * @param i18NextPipe - Internationalization service for translations.
 * @param itemService - Service for managing items.
 * @param inputService - Service for handling input-related operations.
 * @param confirmationService - Service to manage confirmation dialogs.
 */

  constructor(
    private dialogConfig: DynamicDialogConfig,
    protected suggestionService: SuggestionService,
    private store: Store,
    protected quickFillService: QuickfillService,
    private i18NextPipe: I18NextPipe,
    private itemService: ItemService,
    private inputService: InputService,
    private confirmationService: ConfirmationService
  ) {
    this.dialogConfig.data.onSubmit = this.onSubmit.bind(this);
    this.dialogConfig.data.onCancel = this.onCancel.bind(this);

    this.sOptions = CUSTOM_RULE_S;

    this.dnOptions = Object.entries(DIAMETER_NOMINAL_LABELS)
      .map(([value, label]) => ({ label, value: parseFloat(value) }))
      .sort((a, b) => (a.value as number) - (b.value as number));
  }

  /**
   * Initializes the component by subscribing to the quickfill state in the store,
   * setting up the help accordion states, and updating the form with the initial model.
   */
  ngOnInit(): void {
    this.helpAccordionPartsActivated = false;
    this.helpAccordionGroupsActivated = [];

    this.subscriptions.add(
      this.store.select(QuickfillSelectors.selectQuickfill).subscribe((model) => {
        model = cloneDeep(model);
        this.availablePresets = [...SYSTEM_PRESETS, ...(model?.presets ?? [])];

        let usedPreset: QuickfillPreset | undefined = model.usedPresetId ? this.availablePresets.find(p => p.id === model.usedPresetId) : undefined;
        if (!usedPreset) {
          usedPreset = this.availablePresets[0];
        }

        this.updateFormByModel({
          ...model,
          usedPresetId: usedPreset.id
        });
      })
    );
  }

  /**
   * Unsubscribes from all subscriptions when the component is destroyed.
   * This ensures that no memory leaks occur and that resources are properly cleaned up.
   *
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Handles the submission of the quick fill form.
   * 
   * @returns {boolean} - Returns `true` if the form is valid and submission is successful.
   *                      Returns `false` if the form is invalid or submission fails.
   */
  onSubmit(): boolean {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }

    this.updateSelectedPreset();
    const model: Quickfill = this.form.value;
    this.dialogConfig.data.model = {
      usedPresetId: model.usedPresetId,
      groups: model.groups,
      presets: this.availablePresets.filter(p => !SYSTEM_PRESETS.find(sp => sp.id === p.id))
    };

    this.store.dispatch(QuickfillActions.update({ quickfill: {
      ...this.dialogConfig.data.model,
      groups: []
    }}));
    return true;
  }

  /**
   * Handles the cancellation of the quick fill form.
   * 
   * @returns {boolean} - Returns `true` to indicate successful cancellation.
   *                      Returns `false` if cancellation fails.
   */
  onCancel(): boolean {
    const model: Quickfill = this.form.value;

    this.updateSelectedPreset();
    this.dialogConfig.data.model = {
      usedPresetId: model.usedPresetId,
      groups: model.groups,
      presets: this.availablePresets.filter(p => !SYSTEM_PRESETS.find(sp => sp.id === p.id))
    };

    this.store.dispatch(QuickfillActions.update({ quickfill: this.dialogConfig.data.model }));
    return true;
  }

  /**
   * Updates the selected preset with the current form values.
   * This function is called when the user selects a different preset or when the form is submitted.
   * 
   * @returns {void}
   * 
   * @remarks
   * - If the selected preset is not editable or does not exist, the function does nothing.
   * - The function retrieves the current form values for the preset parts and updates the selected preset's parts accordingly.
   */
  private updateSelectedPreset(): void {
    if (!this.selectedPreset || !this.selectedPresetEditable) {
      return;
    }
    const parts = this.getPresetPartsControls().map((control) => control.value);
    this.selectedPreset?.parts?.splice(0, this.selectedPreset?.parts?.length, ...parts);
  }

  /**
   * Updates the form by the provided quickfill model.
   *
   * @param model - The quickfill model to update the form with.
   *
   * @remarks
   * - Sets the selected preset and its editability.
   * - Creates preset options and updates the preset options observable.
   * - Initializes the form with the provided model.
   * - Disables the preset form group if the selected preset is not editable.
   * - Adds a new group if the model does not contain any groups.
   */
  private updateFormByModel(model: Quickfill): void {
    this.selectedPreset = this.availablePresets.find(p => p.id === model.usedPresetId) ?? this.availablePresets[0];
    this.selectedPresetEditable = !SYSTEM_PRESETS.find(p => p.id === model.usedPresetId);

    const presetOptions = this.availablePresets.map(p => (p as SystemPreset)?.i18nName ? {
      id: p.id,
      label: this.i18NextPipe.transform(`${SCOPE}.${(p as SystemPreset).i18nName}`),
      editable: false
    } : {
      id: p.id,
      label: (p as UserPreset).name,
      editable: true
    });

    presetOptions.push({
      id: 'create',
      label: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.menu.add`),
      editable: false
    });

    this.presetOptions$.next(presetOptions);

    this.form = new FormGroup({
      usedPresetId: new FormControl((this.selectedPreset as QuickfillPreset).id),
      preset: new FormGroup({
        parts: this.createPresetsPartsFormArray((this.selectedPreset as QuickfillPreset))
      }),
      groups: new FormArray(
        (model?.groups ?? []).map((group: QuickfillGroup) =>
          this.createGroupFormGroup(group)
        ),
        [Validators.required, Validators.minLength(1)]
      )
    });

    if (!this.selectedPresetEditable) {
      this.form.get('preset')?.disable();
    }

    if (!model?.groups?.length) {
      this.addGroup();
    }
  }

  /**
   * Creates a form array for the parts of a quick fill preset.
   * 
   * @param preset - The quick fill preset to create the form array for.
   * 
   * @returns {FormArray} - A form array containing form groups for each part of the preset.
   * 
   * @remarks
   * - The form array is initialized with form groups for each part of the preset.
   * - The form array is required and must have a minimum length of 1.
   * - The form array is created using the `createPartFormGroup` function to create form groups for each part.
   */
  private createPresetsPartsFormArray(preset: QuickfillPreset): FormArray {
    return new FormArray(
      (preset.parts ?? []).map((part: QuickfillPart) =>
        this.createPartFormGroup(part)
      ),
      [Validators.required, Validators.minLength(1)]
    )
  }

  /**
   * Retrieves the form groups for the parts of the preset.
   *
   * @returns {FormGroup[]} - An array of form groups, each representing a part of the preset.
   *
   * @remarks
   * This function retrieves the form groups for the parts of the preset from the 'preset' form group.
   * It casts the 'parts' form array to an array of form groups and returns it.
   */
  protected getPresetPartsControls(): FormGroup[] {
    return (this.form.get('preset')?.get("parts") as FormArray)?.controls as FormGroup[];
  }

  /**
   * Retrieves the form groups for the groups of the quick fill model.
   *
   * @returns {FormGroup[]} - An array of form groups, each representing a group of the quick fill model.
   *
   * @remarks
   * This function retrieves the form groups for the groups of the quick fill model from the 'groups' form array.
   * It casts the 'groups' form array to an array of form groups and returns it.
   */
  protected getGroupsControls(): FormGroup[] {
    return (this.form.get("groups") as FormArray).controls as FormGroup[];
  }

  /**
   * Creates a form group for a part of a quick fill preset.
   *
   * @param part - The quick fill part to create the form group for.
   *               If not provided, an empty form group will be created.
   *
   * @returns {FormGroup} - A form group containing form controls for the part's properties.
   *
   * @remarks
   * - The form group contains form controls for the part's typeId, material, quantity, and active properties.
   * - The quantity control is required.
   * - The active control is required and has a default value of `true` if not provided in the part.
   * - The material control is disabled if the part's typeId is not provided.
   */
  protected createPartFormGroup(part?: QuickfillPart): FormGroup {
    const formGroup = new FormGroup({
      typeId: new FormControl(part?.typeId, [
        Validators.required,
      ]),
      material: new FormControl(part?.material, [
        Validators.required,
      ]),
      quantity: new FormControl(part?.quantity, [Validators.required]),
      active: new FormControl(
        typeof part?.active == "undefined" ? true : part.active,
        [Validators.required]
      ),
    });

    if (!part?.typeId) {
      formGroup.get('material')?.disable();
    }
    return formGroup;
  }

  /**
   * Creates a form group for a group of a quick fill model.
   *
   * @param group - The quick fill group to create the form group for.
   *                If not provided, an empty form group will be created.
   *
   * @returns {FormGroup} - A form group containing form controls for the group's properties.
   *
   * @remarks
   * - The form group contains form controls for the group's name, length, dn, and s properties.
   * - The name control is required.
   * - The length, dn, and s controls are required.
   */
  protected createGroupFormGroup(group?: QuickfillGroup): FormGroup {
    return new FormGroup({
      name: new FormControl(group?.name, [Validators.required]),
      length: new FormControl(group?.length, [Validators.required]),
      dn: new FormControl(group?.dn, [Validators.required]),
      s: new FormControl(group?.s, [Validators.required])
    });
  }

  /**
   * Adds a new part to the quick fill preset.
   *
   * @remarks
   * This function retrieves the 'parts' form array from the 'preset' form group and pushes a new form group
   * created using the `createPartFormGroup` function onto the array.
   *
   * @returns {void}
   */
  protected addPresetPart(): void {
    (this.form.get('preset')?.get("parts") as FormArray)?.push(this.createPartFormGroup());
  }

  /**
   * Adds a new group to the quick fill model.
   *
   * @remarks
   * This function retrieves the 'groups' form array from the 'groups' form group and pushes a new form group
   * created using the `createGroupFormGroup` function onto the array.
   * If the `helpAccordionGroupsActivated` array is defined, it pushes a new `true` value onto the array.
   *
   * @returns {void}
   */
  protected addGroup(): void {
    (this.form.get("groups") as FormArray).push(this.createGroupFormGroup());
    if (this.helpAccordionGroupsActivated) {
      this.helpAccordionGroupsActivated.push(true);
    }
  }

  /**
   * Deletes a part from the quick fill preset.
   *
   * @param index - The index of the part to delete.
   *
   * @remarks
   * - If the 'parts' form array contains more than one part, the part at the specified index is removed.
   * - If the 'parts' form array contains only one part, all form control values are reset to `null`.
   *
   * @returns {void}
   */
  protected deletePresetPart(index: number): void {
    const parts = this.form.get('preset')?.get("parts") as FormArray;
    if (parts.length > 1) {
      parts.removeAt(index);
    } else {
      parts.controls.forEach((control) => {
        control.reset({
          typeId: null,
          material: null,
          quantity: null,
          active: true,
        });
      });
    }
  }

  /**
   * Deletes a group from the quick fill model.
   *
   * @param event - The event object that triggered the deletion.
   * @param index - The index of the group to delete.
   *
   * @remarks
   * - The function prevents the default event behavior.
   * - If the 'groups' form array contains more than one group, the group at the specified index is removed.
   * - If the 'groups' form array contains only one group, all form control values are reset to `null`.
   *
   * @returns {void}
   */
  protected deleteGroup(event: Event, index: number): void {
    event.stopPropagation();
    event.preventDefault();

    const groups = this.form.get("groups") as FormArray;
    if (groups.length > 1) {
      groups.removeAt(index);
    } else {
      groups.controls.forEach((control) => {
        control.reset({
          name: null,
          length: null,
          dn: null,
          s: null,
          material: null,
        });
      });
    }
  }

  /**
   * Retrieves the internationalized quantity suffix for a given item type ID.
   *
   * @param typeId - The item type ID for which to retrieve the quantity suffix.
   *
   * @returns {string} - The internationalized quantity suffix for the given item type ID.
   *
   * @remarks
   * - If the `typeId` parameter is falsy, an empty string is returned.
   * - The function creates an item entity with the specified `typeId` and category.
   * - The function retrieves the unit of the item entity using the `itemService.getUnit` method.
   * - The function returns the internationalized quantity suffix from the `ITEM_UNIT_LABEL_MAP` object,
   *   or an empty string if the unit is not found in the map.
   */
  protected getI18NQuantitySuffix(typeId: string): string {
    if (!typeId) {
      return "";
    }

    const entity = instanciateItem({
      category: ItemCategory.PIPEFITTING,
      typeId: typeId
    } as any);

    const unit = this.itemService.getUnit(entity);
    return ITEM_UNIT_LABEL_MAP[unit] ? ITEM_UNIT_LABEL_MAP[unit] : "";
  }

  /**
   * Selects a preset from the available presets based on the provided preset ID.
   * If the preset ID is 'create', a new preset is created and selected.
   * If the `skipUpdatePreset` parameter is not provided or is `false`, the selected preset's parts are updated.
   *
   * @param presetId - The ID of the preset to select.
   * @param skipUpdatePreset - An optional parameter indicating whether to skip updating the selected preset's parts.
   *                           If `true`, the selected preset's parts will not be updated.
   *
   * @returns {void}
   */
  protected selectPreset(presetId: string, skipUpdatePreset?: boolean): void {
    if (presetId === 'create') {
      this.createNewPreset();
      return;
    }

    if (!skipUpdatePreset) {
      const currentSelectedPresetIndex = this.availablePresets.findIndex(p => p.id === this.selectedPreset?.id);
      if (currentSelectedPresetIndex !== -1) {
        this.updateSelectedPreset();
      }
    }

    const preset = this.availablePresets.find(p => p.id === presetId);
    if (!preset) {
      return;
    }

    this.updateFormByModel({
      ...this.form.value,
      usedPresetId: preset.id
    });
  }

  /**
   * Creates a new user preset and adds it to the available presets list.
   * The function prompts the user to enter a name for the new preset using the `inputService.claimTextInput` method.
   * If the user cancels the input, the function restores the original selected preset and returns.
   * If the user enters a name, the function creates a new user preset with a unique ID, the entered name, and an empty parts array.
   * The new preset is then added to the available presets list and selected.
   * Finally, the function updates the selected preset's parts and calls the `selectPreset` method to switch to the new preset.
   *
   * @returns {Promise<void>} - A promise that resolves when the new preset is created and selected.
   */
  protected async createNewPreset(): Promise<void> {
    const newPreset: UserPreset = {
      id: uuidv4(),
      name: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.new.initial-value`),
      parts: []
    };

    const name = await this.inputService.claimTextInput({
      title: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.new.title`),
      message: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.new.message`),
      placeholder: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.new.placeholder`),
      initialValue: newPreset.name,
      buttons: {
        confirm: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.new.button.confirm`),
        cancel: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.new.button.cancel`),
      }
    });

    if (!name) {
      this.form.patchValue({ usedPresetId: this.selectedPreset?.id });
      return;
    }

    newPreset.name = name;
    this.availablePresets.push(newPreset);
    this.updateSelectedPreset();

    this.selectPreset(newPreset.id, true);
  }

  /**
   * Renames the selected user preset.
   * 
   * @remarks
   * - If the selected preset is not a user preset or is not editable, the function returns without doing anything.
   * - The function prompts the user to enter a new name for the preset using the `inputService.claimTextInput` method.
   * - If the user cancels the input, the function returns without doing anything.
   * - The function finds the index of the selected preset in the `availablePresets` array.
   * - If the preset is not found, the function returns without doing anything.
   * - The function updates the name of the selected preset with the entered name.
   * - The function updates the selected preset's parts and calls the `updateFormByModel` method to reflect the changes in the form.
   * 
   * @returns {Promise<void>} - A promise that resolves when the preset is renamed.
   */
  protected async renamePreset(): Promise<void> {
    if (!this.selectedPreset || !this.selectedPresetEditable) {
      return;
    }

    const name = await this.inputService.claimTextInput({
      title: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.rename.title`),
      message: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.rename.message`),
      placeholder: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.rename.placeholder`),
      initialValue: (this.selectedPreset as UserPreset).name,
      buttons: {
        confirm: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.rename.button.confirm`),
        cancel: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.rename.button.cancel`),
      }
    });

    if (!name) {
      return;
    }

    const index = this.availablePresets.findIndex(p => p.id === (this.selectedPreset as QuickfillPreset).id);
    if (index === -1) {
      return;
    }

    (this.availablePresets[index] as UserPreset).name = name;
    this.updateSelectedPreset();

    this.updateFormByModel(this.form.value);
  }

  /**
   * Deletes the selected user preset from the available presets list.
   *
   * @param event - The event object that triggered the deletion.
   *                This parameter is optional and used to determine the target of the confirmation dialog.
   *
   * @returns {Promise<void>} - A promise that resolves when the preset is deleted.
   *
   * @remarks
   * - If the selected preset is not a user preset or is not editable, the function returns without doing anything.
   * - The function prompts the user to confirm the deletion using the `confirmationService.confirm` method.
   * - If the user cancels the confirmation, the function returns without doing anything.
   * - The function finds the index of the selected preset in the `availablePresets` array.
   * - If the preset is not found, the function returns without doing anything.
   * - The function removes the selected preset from the `availablePresets` array.
   * - The function selects the first preset in the `availablePresets` array as the new selected preset.
   */
  protected async deletePreset(event?: Event): Promise<void> {
    if (!this.selectedPreset || !this.selectedPresetEditable) {
      return;
    }

    const confirm = await new Promise((resolve) => 
      this.confirmationService.confirm({
        target: event?.target ?? undefined,
        header: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.delete.title`),
        message: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.delete.message`),
        acceptLabel: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.delete.button.confirm`),
        rejectLabel: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.delete.button.cancel`),
        acceptButtonStyleClass: "p-button-primary",
        rejectButtonStyleClass: "p-button-secondary",
        icon: "pi pi-exclamation-triangle",
        accept: () => resolve(true),
        reject: () => resolve(false)
      })
    );

    if (!confirm) {
      return;
    }

    const index = this.availablePresets.findIndex(p => p.id === (this.selectedPreset as QuickfillPreset).id);
    if (index === -1) {
      return;
    }

    this.availablePresets.splice(index, 1);
    this.selectPreset(this.availablePresets[0].id);
  }

  /**
   * Duplicates the selected user preset and adds it to the available presets list.
   *
   * @remarks
   * - If the selected preset is not defined, the function returns without doing anything.
   * - The function prompts the user to enter a new name for the duplicated preset using the `inputService.claimTextInput` method.
   * - If the user cancels the input, the function returns without doing anything.
   * - The function updates the selected preset's parts.
   * - A new user preset is created with a unique ID, the entered name, and a deep copy of the selected preset's parts.
   * - The new preset is added to the available presets list.
   * - The function selects the new preset.
   *
   * @returns {Promise<void>} - A promise that resolves when the preset is duplicated and added.
   */
  protected async duplicatePreset(): Promise<void> {
    if (!this.selectedPreset) {
      return;
    }

    const name = await this.inputService.claimTextInput({
      title: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.duplicate.title`),
      message: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.duplicate.message`),
      placeholder: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.duplicate.placeholder`),
      initialValue: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.duplicate.initial-value`, { name: (this.selectedPreset as UserPreset).name ? (this.selectedPreset as UserPreset).name : this.i18NextPipe.transform(`${SCOPE}.`+(this.selectedPreset as SystemPreset).i18nName) }),
      buttons: {
        confirm: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.duplicate.button.confirm`),
        cancel: this.i18NextPipe.transform(`${SCOPE}.accordion.parts.preset.dialog.duplicate.button.cancel`),
      }
    });

    if (!name) {
      return;
    }

    this.updateSelectedPreset();

    const newPresetId = uuidv4();
    const newPreset: UserPreset = {
      id: newPresetId,
      name: name,
      parts: cloneDeep((this.selectedPreset as UserPreset).parts)
    };

    this.availablePresets.push(newPreset);
    this.selectPreset(newPresetId, true);
  }
}
