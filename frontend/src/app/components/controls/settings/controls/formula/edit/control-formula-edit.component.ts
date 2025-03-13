import { Component, OnDestroy, OnInit } from '@angular/core';
import { I18NEXT_SCOPE, I18NextModule, I18NextPipe } from 'angular-i18next';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { BehaviorSubject, map, Subscription } from 'rxjs';
import { Option } from '@common/interfaces/suggestion.interface';
import { CONDITION_CONFIG } from '../../../../../../consts/formula.const';
import { Formula, FormulaCondition } from '../../../../../../interfaces/formula.interface';
import { FormulaService } from '../../../../../../services/formula/formula.service';
import { SuggestionService } from '../../../../../../services/suggestion/suggestion.service';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { fadeInOutAnimation } from '../../../../../../utils/animations.util';
import { safeEquals } from '@common/utils/operations.util';
import { ItemPipeFittingEntity } from '@common/entities/item/items/pipe-fitting.entity';
import { AccordionModule } from 'primeng/accordion';
import { Button } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { PrimeTemplate } from 'primeng/api';
import { PanelModule } from 'primeng/panel';
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MessageModule } from 'primeng/message';
import { NgClass, AsyncPipe } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { DIAMETER_NOMINAL_LABELS } from '@common/constants/diameter-nominal.const';
import * as SettingsSelectors from '../../../../../../store/selectors/settings.selector';
import { Settings } from 'src/app/interfaces/settings.interface';
import { Store } from '@ngrx/store';

interface OptionItem {
  label: string;
  value: string | number;
  group?: string
}
interface OptionGroup {
  label: string;
  value: string | number;
  items: OptionItem[];
}

/**
 * Custom validator function for Angular Reactive Forms to validate conditions in a formula.
 * This function checks for overlapping conditions and conflicting operations in the formula conditions.
 *
 * @param control - The AbstractControl to validate. Expected to contain an array of FormulaCondition objects.
 * @returns An object with a 'overlapping' property set to true if overlapping conditions are found,
 *          or an object with a 'conflicting' property set to true if conflicting operations are found.
 *          Returns null if no overlapping or conflicting conditions are found.
 */
function ConditionsValidator(control: AbstractControl) {
  if (!control.value || !Array.isArray(control.value) || control.value.length === 0) {
    return null;
  }

  const conditions = (control.value as FormulaCondition[]).filter((condition) => condition.option && condition.operation && ((typeof condition.value === 'string' && condition.value.length > 0) || (typeof condition.value === 'number' && condition.value >= 0)));

  // check if some conditions are overlapping
  for (let i = 0; i < conditions.length; i++) {
    for (let j = i + 1; j < conditions.length; j++) {
      const conditionA = conditions[i];
      const conditionB = conditions[j];

      // skip if options are different or if value is empty
      if (conditionA.option !== conditionB.option || !conditionA.value || !conditionB.value) {
        continue;
      }

      // no duplicate operations
      if (conditionA.operation === conditionB.operation) {
        return { overlapping: true };
      }

      // no conflicting operations
      if (conditionA.operation === 'eq') {
        return { overlapping: true };
      }
      if (conditionA.operation === 'neq') {
        return { overlapping: true };
      }

      // no conflicting greater operations
      if (conditionA.operation === 'gte' && conditionB.operation === 'gt') {
        return { overlapping: true };
      }
      if (conditionA.operation === 'gt' && conditionB.operation === 'gte') {
        return { overlapping: true };
      }

      // no conflicting lesser operations
      if (conditionA.operation === 'lt' && conditionB.operation === 'lte') {
        return { overlapping: true };
      }
      if (conditionA.operation === 'lte' && conditionB.operation === 'lt') {
        return { overlapping: true };
      }

      // no conflicting greater and lesser operations
      if (conditionA.operation === 'gte' && conditionB.operation === 'lte' && conditionA.value > conditionB.value) {
        return { overlapping: true };
      }
      if (conditionA.operation === 'lte' && conditionB.operation === 'gte' && conditionA.value < conditionB.value) {
        return { overlapping: true };
      }

      if ((conditionA.operation === 'gte' || conditionA.operation === 'gt') && conditionB.operation === 'lt' && (conditionA.value >= conditionB.value || safeEquals(conditionA.value, conditionB.value))) {
        return { overlapping: true };
      }
      if ((conditionA.operation === 'lte' || conditionA.operation === 'lt') && conditionB.operation === 'gt' && (conditionA.value <= conditionB.value || safeEquals(conditionA.value, conditionB.value))) {
        return { overlapping: true };
      }
    }
  }


  return null;
};


@Component({
    selector: 'app-control-formula-edit',
    templateUrl: './control-formula-edit.component.html',
    styleUrls: ['./control-formula-edit.component.scss'],
    providers: [{
      provide: I18NEXT_SCOPE,
      useValue: 'components.controls.settings.controls.formula-edit'
    }],
    animations: [fadeInOutAnimation],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, InputTextModule, MessageModule, InputSwitchModule, TooltipModule, PanelModule, PrimeTemplate, TableModule, DropdownModule, Button, AccordionModule, NgClass, AsyncPipe, I18NextModule]
})
export class ControlFormulaEditComponent implements OnInit, OnDestroy {
  protected formula!: Formula;
  protected form!: FormGroup;

  protected conditionOptions = CONDITION_CONFIG;
  protected conditionOptionLabels = CONDITION_CONFIG.reduce((acc, curr) => {
    acc[curr.key] = curr.label;
    return acc;
  }, {} as any);
  protected helpAccordionActivated = false;

  protected conditionOperationLabels = CONDITION_CONFIG.reduce((acc, curr) => {
    for (const operation of curr.operations) {
      if (typeof acc[operation.key] !== 'undefined') {
        continue;
      }
      acc[operation.key] = operation.label;
    }
    return acc;
  }, {} as any);

  protected idOptions$: BehaviorSubject<OptionGroup[]> = new BehaviorSubject<OptionGroup[]>([]);
  protected materialOptions$: BehaviorSubject<OptionGroup[]> = new BehaviorSubject<OptionGroup[]>([]);
  protected dnOptions: OptionItem[] = [];

  private subscriptions = new Subscription();
  protected settings!: Settings;

/**
 * Constructs a new instance of the ControlFormulaEditComponent.
 *
 * @param formulaService - The service to handle formula operations.
 * @param dialogConfig - The configuration for the dynamic dialog.
 * @param suggestionService - The service to provide suggestions.
 * @param i18NextPipe - The pipe for internationalization.
 * @param store - The store for managing application state.
 */
  constructor(
    protected formulaService: FormulaService,
    private dialogConfig: DynamicDialogConfig,
    private suggestionService: SuggestionService,
    private i18NextPipe: I18NextPipe,
    private store: Store
  ) {
    this.dialogConfig.data.onSubmit = this.onSubmit.bind(this);
  }

  /**
   * Initializes the component by setting up form controls, subscriptions, and options.
   *
   * @returns {void}
   */
  ngOnInit(): void {
    this.initializeIdOptions();
    this.initializeMaterialOptions();
    this.initializeDnOptions();

    // Assign the formula passed through the dialog configuration to the component's formula property
    this.formula = this.dialogConfig.data.formula;

    // Create a new FormGroup with form controls for the formula properties
    this.form = new FormGroup({
      id: new FormControl(this.formula.id),
      name: new FormControl(this.formula.name, [Validators.required]),
      active: new FormControl(this.formula.active),
      conditions: new FormArray(
        // Map each condition in the formula to a FormGroup using the createdConditionFormGroup method
        this.formula.conditions.map((condition) => this.createdConditionFormGroup(condition)),
        // Apply validation rules for the conditions array
        [Validators.required, Validators.minLength(1), ConditionsValidator]
      ),
      calculation: new FormGroup({
        effordHours: new FormControl(this.formula.calculation.effordHours),
        priceMaterial: new FormControl(this.formula.calculation.priceMaterial)
      })
    });

    // Subscribe to the temporary settings state and assign the settings to the component's settings property
    this.subscriptions.add(
      this.store.select(SettingsSelectors.selectTemporary).subscribe((settings) => {
        this.settings = settings;
      })
    );
  }

  /**
   * Destroys the component and unsubscribes from all subscriptions to prevent memory leaks.
   *
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Handles the submission of the formula edit form.
   * Validates the form, marks all form controls as touched if the form is invalid,
   * and prepares the form data for submission.
   *
   * @returns {boolean} - Returns true if the form is valid and submission is successful;
   *                      otherwise, returns false.
   */
  private onSubmit(): boolean {
    // Check if the form is invalid
    if (this.form.invalid) {
      // Mark all form controls as touched
      this.form.markAllAsTouched();
      // Return false to indicate invalid form submission
      return false;
    }

    // Prepare the form data for submission
    const formData = {
      ...this.form.value,
      calculation: {
        ...this.form.value.calculation,
        effordHours: this.form.value.calculation.effordHours,
        priceMaterial: this.form.value.calculation.priceMaterial,
      }
    };

    // Assign the prepared form data to the formula property in the dialog configuration
    this.dialogConfig.data.formula = formData;

    // Return true to indicate successful form submission
    return true;
  }

  /**
   * Retrieves the form controls for the conditions in the formula.
   *
   * @returns {FormGroup[]} - An array of FormGroup objects representing the conditions in the formula.
   *
   * @remarks
   * This function retrieves the form controls for the conditions in the formula.
   * It assumes that the form is already initialized and contains a 'conditions' FormArray.
   * The function casts the 'conditions' control to a FormArray and returns its controls as an array of FormGroup objects.
   */
  protected getConditionControls(): FormGroup[] {
    return (this.form.get('conditions') as FormArray).controls as FormGroup[];
  }

  /**
   * Creates a FormGroup for a condition in the formula.
   *
   * @param condition - An optional FormulaCondition object to initialize the form controls.
   *                    If not provided, the form controls will be initialized with null values.
   *
   * @returns A FormGroup with form controls for the condition's option, operation, and value.
   *          The form controls are initialized with the provided condition values or null if not provided.
   *          The option control is required and validated using Validators.required.
   *          The operation control is required and validated using Validators.required.
   *          The value control is required and validated using Validators.required.
   */
  protected createdConditionFormGroup(condition?: FormulaCondition): FormGroup {
    return new FormGroup({
      option: new FormControl(condition?.option, [Validators.required]),
      operation: new FormControl(condition?.operation, [Validators.required]),
      value: new FormControl(condition?.value, [Validators.required])
    });
  }

  /**
   * Adds a new condition to the formula's conditions array.
   *
   * This function creates a new FormGroup for the condition using the `createdConditionFormGroup` method.
   * It then disables the operation and value controls of the new FormGroup.
   * Finally, it pushes the new FormGroup into the 'conditions' FormArray of the form.
   *
   * @returns {void}
   */
  protected addCondition(): void {
    const newCondition = this.createdConditionFormGroup();
    newCondition.get('operation')?.disable();
    newCondition.get('value')?.disable();

    (this.form.get('conditions') as FormArray).push(newCondition);
  }

  /**
   * Deletes a condition from the formula's conditions array at the specified index.
   *
   * @param index - The index of the condition to be deleted.
   *
   * @returns {void}
   *
   * @remarks This function removes the condition at the specified index from the 'conditions' FormArray of the form.
   *          It is assumed that the form is already initialized and contains a 'conditions' FormArray.
   */
  protected deleteCondition(index: number): void {
    (this.form.get('conditions') as FormArray).removeAt(index);
  }

  /**
   * Retrieves the operations available for a given condition option.
   *
   * @param option - The condition option for which to retrieve operations.
   *                  If the option is null or undefined, an empty array is returned.
   *
   * @returns An array of objects representing the operations available for the given option.
   *          Each object contains a 'key' property representing the operation key and a 'label' property representing the operation label.
   *          If the option does not match any condition in the 'conditionOptions' array, an empty array is returned.
   */
  protected getOperations(option: string | null): { key: string; label: string; }[] {
    if (!option) {
      return [];
    }
    return this.conditionOptions.find((condition) => condition.key === option)?.operations || [];
  }

  /**
   * Retrieves the data type associated with a given condition option.
   *
   * @param option - The condition option for which to retrieve the data type.
   *                  If the option is null or undefined, the function returns 'text' as default.
   *
   * @returns A string representing the data type associated with the given condition option.
   *          If the option matches any condition in the 'conditionOptions' array, the function returns the condition's type.
   *          If the option does not match any condition, the function returns 'text' as default.
   */
  protected getValueType(option: string | null): string {
    if (!option) {
      return 'text';
    }
    return this.conditionOptions.find((condition) => condition.key === option)?.type || 'text';
  }

  /**
   * Initializes the ID options for the formula edit form.
   * Retrieves the typeId suggestions from the suggestion service and groups them by their respective group.
   * Updates the idOptions$ BehaviorSubject with the grouped options.
   *
   * @returns {Promise<void>} - A promise that resolves when the initialization is complete.
   */
  protected async initializeIdOptions(): Promise<void> {
    const options = (await this.suggestionService.getColumnSuggestions(new ItemPipeFittingEntity({
      quantity: 1
    }), 'typeId', true)) as Option<number>[];

    // Group the options by their respective group
    const groupedOptions = options.reduce((acc: OptionGroup[], value: OptionItem) => {
      const group = acc.find((a: OptionItem) => a.value === value.group);
      if (!group) {
        acc.push({
          label: this.i18NextPipe.transform('pipefittings.group.typeId.' + value.group),
          value: value.group,
          items: [value]
        } as OptionGroup);
        return acc;
      }
      group.items.push(value);
      return acc;
    }, []);

    // Update the idOptions$ BehaviorSubject with the grouped options
    this.idOptions$.next(groupedOptions);
  }

  /**
   * Initializes the material options for the formula edit form.
   * Retrieves the material suggestions from the suggestion service and groups them by their respective group.
   * Updates the materialOptions$ BehaviorSubject with the grouped options.
   *
   * @returns {Promise<void>} - A promise that resolves when the initialization is complete.
   *
   * @remarks This function uses the `suggestionService` to retrieve material suggestions for pipe fittings.
   *          It then groups the suggestions by their respective group and updates the `materialOptions$` BehaviorSubject with the grouped options.
   */
  protected async initializeMaterialOptions(): Promise<void> {
    const options = (await this.suggestionService.getColumnSuggestions(new ItemPipeFittingEntity({ quantity: 1 }), 'material', true)) as Option<number>[];
    const groupedOptions = options.reduce((acc: OptionGroup[], value: OptionItem) => {
      const group = acc.find((a: OptionItem) => a.value === value.group);
      if (!group) {
        acc.push({
          label: this.i18NextPipe.transform('pipefittings.group.material.' + value.group),
          value: value.group,
          items: [value]
        } as OptionGroup);
        return acc;
      }
      group.items.push(value);
      return acc;
    }, []);

    this.materialOptions$.next(groupedOptions);
  }

  /**
   * Initializes the DN (Diameter Nominal) options for the formula edit form.
   * Retrieves the DN options from the DIAMETER_NOMINAL_LABELS constant and sorts them by their values.
   *
   * @returns {void}
   *
   * @remarks This function iterates over the entries of the DIAMETER_NOMINAL_LABELS constant,
   *          creates OptionItem objects for each entry, and pushes them into the dnOptions array.
   *          Finally, it sorts the dnOptions array in ascending order based on the value of each option.
   */
  protected initializeDnOptions(): void {
    Object.entries(DIAMETER_NOMINAL_LABELS).forEach(([value, label]) => {
      this.dnOptions.push({ label, value: parseFloat(value) });
    });

    this.dnOptions.sort((a, b) => (a.value as number) - (b.value as number));
  }

  /**
   * Retrieves the label associated with a selected ID option from the idOptions$ BehaviorSubject.
   *
   * @param value - The value of the selected ID option.
   *
   * @returns An observable of strings representing the label of the selected ID option.
   *          If the selected ID option is found in the idOptions$, the observable emits the corresponding label.
   *          If the selected ID option is not found, the observable emits null.
   *
   * @remarks This function uses the RxJS map operator to transform the idOptions$ BehaviorSubject into an observable of strings.
   *          It iterates over each group in the idOptions$ and searches for an item with a matching value.
   *          If a matching item is found, the function emits the corresponding label.
   *          If no matching item is found, the function emits null.
   */
  protected getSelectedIdOptionLabel$(value: number) {
    return this.idOptions$.pipe(map((options) => {
      for (const group of options) {
        const item = group.items.find((item) => item.value === value);
        if (item) {
          return item.label;
        }
      }
      return null;
    }));
  }

  /**
   * Retrieves the label associated with a selected material option from the materialOptions$ BehaviorSubject.
   *
   * @param value - The value of the selected material option.
   *
   * @returns An observable of strings representing the label of the selected material option.
   *          If the selected material option is found in the materialOptions$, the observable emits the corresponding label.
   *          If the selected material option is not found, the observable emits null.
   *
   * @remarks This function uses the RxJS map operator to transform the materialOptions$ BehaviorSubject into an observable of strings.
   *          It iterates over each group in the materialOptions$ and searches for an item with a matching value.
   *          If a matching item is found, the function emits the corresponding label.
   *          If no matching item is found, the function emits null.
   */
  protected getSelectedMaterialOptionLabel$(value: number) {
    return this.materialOptions$.pipe(map((options) => {
      for (const group of options) {
        const item = group.items.find((item) => item.value === value);
        if (item) {
          return item.label;
        }
      }
      return null;
    }));
  }

  /**
   * Retrieves the label associated with a selected DN (Diameter Nominal) option from the dnOptions array.
   *
   * @param value - The value of the selected DN option.
   *
   * @returns A string representing the label of the selected DN option.
   *          If the selected DN option is found in the dnOptions array, the function returns the corresponding label.
   *          If the selected DN option is not found, the function returns null.
   *
   * @remarks This function uses the Array.prototype.find method to search for an option in the dnOptions array with a matching value.
   *          If a matching option is found, the function returns the corresponding label.
   *          If no matching option is found, the function returns null.
   */
  protected getSelectedDNOptionLabel(value: number) {
    return this.dnOptions.find((option) => option.value === value)?.label;
  }

  /**
   * Handles the change in the condition option in the formula edit form.
   *
   * @param formGroup - The FormGroup representing the condition in the form.
   *
   * @remarks This function clears the selected operation and value for the condition.
   *          It then enables the operation control and disables the value control.
   *          This function is called when the condition option is changed in the form.
   *
   * @returns {void}
   */
  protected onConditionOptionChange(formGroup: FormGroup): void {
    formGroup.get('operation')?.setValue(null);
    formGroup.get('value')?.setValue(null);

    formGroup.get('operation')?.enable();
    formGroup.get('value')?.disable();
  }

  /**
   * Handles the change in the condition operation in the formula edit form.
   *
   * @param formGroup - The FormGroup representing the condition in the form.
   *
   * @remarks This function enables the value control for the condition.
   *          It is called when the condition operation is changed in the form.
   *
   * @returns {void}
   */
  protected onConditionOperationChange(formGroup: FormGroup): void {
    formGroup.get('value')?.enable();
  }
}
