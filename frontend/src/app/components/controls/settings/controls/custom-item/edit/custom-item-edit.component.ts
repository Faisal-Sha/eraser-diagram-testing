import { Component, OnDestroy, OnInit } from '@angular/core';
import { I18NEXT_SCOPE, I18NextModule, I18NextPipe } from 'angular-i18next';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { FormArray, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SuggestionService } from 'src/app/services/suggestion/suggestion.service';
import { ITEM_UNITS, ItemCategory, ItemEntity } from '@common/entities/item/item.entity';
import itemStructureResolver from '@common/entities/item/resolvers/item-structure';
import { ItemColumn } from '@common/interfaces/items/item-structure.interface';
import { fadeInOutAnimation } from 'src/app/utils/animations.util';
import { getItemInstanceClassByCategory, instanciateItem } from '@common/entities/item/resolvers/item.resolver';
import { CustomItem, CustomItemMode, Settings } from 'src/app/interfaces/settings.interface';
import { Button } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { PrimeTemplate } from 'primeng/api';
import { PanelModule } from 'primeng/panel';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { AttributeName } from '@common/interfaces/attribute.interface';
import { CUSTOM_ITEM_PREFIX } from '@common/constants/custom-item.const';
import { InputNumberModule } from 'primeng/inputnumber';
import { GetItemSuggestionsPipe } from "../../../../../../pipes/get-item-suggestions.pipe";
import { AsyncPipe } from '@angular/common';
import { GetSuggestionLabelPipe } from "../../../../../../pipes/get-suggestion-label.pipe";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ItemService } from 'src/app/services/item/item.service';
import { OptionGroup, OptionItem } from 'src/app/interfaces/option.interface';
import { DIAMETER_NOMINAL_LABELS } from '@common/constants/diameter-nominal.const';
import { FormService } from 'src/app/services/form/form.service';
import { safeEquals } from '@common/utils/operations.util';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import * as SettingsSelectors from '../../../../../../store/selectors/settings.selector';

type FormControlStructure = {
  columns: FormGroup;
  attributes: FormGroup;
};

@Component({
    selector: 'app-custom-item-edit',
    templateUrl: './custom-item-edit.component.html',
    styleUrl: './custom-item-edit.component.scss',
    providers: [{
      provide: I18NEXT_SCOPE,
      useValue: 'components.controls.settings.controls.custom-item-edit'
    }],
    animations: [fadeInOutAnimation],
    standalone: true,
    imports: [
      FormsModule,
      ReactiveFormsModule,
      InputTextModule,
      InputNumberModule,
      DropdownModule,
      PanelModule,
      PrimeTemplate,
      TooltipModule,
      TableModule,
      MessageModule,
      Button,
      I18NextModule,
      GetItemSuggestionsPipe,
      AsyncPipe,
      GetSuggestionLabelPipe,
      ProgressSpinnerModule
  ]
})
export class ControlItemSpecificationEditComponent implements OnInit, OnDestroy {
  /** Enumerations */
  protected AttributeName = AttributeName;
  protected CustomItemMode = CustomItemMode;

  /** Form */
  protected form!: FormGroup;

  /** Data */
  protected mode!: CustomItemMode;
  protected category!: ItemCategory;
  protected classType!: typeof ItemEntity;

  protected itemColumns!: ItemColumn[];
  protected editCustomItem!: CustomItem | null;
  protected customItems!: CustomItem[];

  protected typeIdDummyItem!: ItemEntity;
  protected dummyItems: ItemEntity[] = [];

  protected dnOptions = (Object.keys(DIAMETER_NOMINAL_LABELS)).reduce((acc, value) => {
    acc[0].items.push({
      label: DIAMETER_NOMINAL_LABELS[value as any],
      value: parseFloat(value)
    });
    return acc;
  }, [{
    label: this.i18NextPipe.transform(`pipefittings.group.dn1.Default`),
    items: [] as OptionItem[]
  }]).map(group => ({
    label: this.i18NextPipe.transform(group.label),
    items: group.items.sort((a, b) => (a.value as number) - (b.value as number))
  })) as OptionGroup[];

  protected unitOptions = ITEM_UNITS.map(unit => ({
    label: this.i18NextPipe.transform(unit.i18nLabel),
    value: unit.value
  }));

  private subscriptions = new Subscription();
  protected settings!: Settings;

  private Validators = {
    /**
     * Validator that checks if the current specification is already existing in the custom item.
     * If the specification is already existing, it returns a validation error with the key 'duplicate'.
     * @returns {ValidationErrors | null} - Validation errors if the specification is already existing, otherwise null.
     */
    DuplicateSpecificationValidator: (): ValidatorFn => {
      return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if (!value) {
          return null;
        }

        const specificationControls = this.form.get('specifications') as FormArray<FormGroup>;
        const index = specificationControls.controls.indexOf(control as FormGroup);

        const duplicate = specificationControls?.value.some((specification, i) => {
          if (i === index) {
            return false;
          }
    
          return this.itemColumns.every(itemColumn => {
            const columnKey = itemColumn.itemKey;
            return specification?.['columns']?.[columnKey] === value?.['columns']?.[columnKey];
          });
        });
        return duplicate ? { duplicate: true } : null;
      }
    },

    /**
     * Validator that checks if the typeId is already used by another custom item.
     * If the typeId is already used, it returns a validation error with the key 'duplicate'.
     * @returns {ValidationErrors | null} - Validation errors if the typeId is already used, otherwise null.
     */
    DuplicateTypeIdValidator: (): ValidatorFn => {
      return (control: AbstractControl): ValidationErrors | null => {
        const value = control?.value;
        if (!value) {
          return null;
        }

        const duplicate = this.customItems.some(customItem => customItem.typeId === value && customItem.id !== this.editCustomItem?.id);
        return duplicate ? { duplicate: true } : null;
      }
    },

  /**
   * Validator that checks if at least one column is filled in the form control's value.
   * 
   * @returns {ValidationErrors | null} - Validation errors with the key 'oneColumnRequired' if no columns are present,
   * or 'required' if none of the columns are filled. Returns null if at least one column is filled.
   * 
   * @remarks
   * This validator is used to ensure that at least one column in the 'columns' object of the form control's value is filled.
   * It checks the presence of the 'columns' object and iterates over the item columns to verify if any column has a value.
   * If no columns are present, it returns a validation error with the key 'oneColumnRequired'.
   * If columns are present but none are filled, it returns a validation error with the key 'required'.
   * Otherwise, it returns null indicating the validation passed.
   */
    OneColumnRequiredValidator: (): ValidatorFn => {
      return (control: AbstractControl): ValidationErrors | null => {
        const value = control?.value;
        if (!value) {
          return null;
        }

        const columns = value?.columns;
        if (!columns) {
          return { oneColumnRequired: true };
        }
        

        const columnCount = Object.keys(columns).length;
        if (columnCount > 0) {
          const hasColumn = this.itemColumns.some(itemColumn => {
            const columnKey = itemColumn.itemKey;
            return !!columns[columnKey];
          });

          return hasColumn ? null : { required: true };
        }
        return null;
      }
    },

    /**
     * Validator that requires a column to be used in at least one specification if the column is not filled in.
     * This validator is used for the columns form controls in the custom item dialog.
     * It checks if the column is used in any of the specifications in the custom item dialog.
     * If the column is not used in any of the specifications, it returns a validation error with the key 'required'.
     * @returns {ValidationErrors | null} - Validation errors if the column is not used in any of the specifications, otherwise null.
     */
    UsedColumnRequiredValidator: (): ValidatorFn => {
      return (control: AbstractControl): ValidationErrors | null => {
        if (!!control?.value) {
          return null;
        }

        const groupControls = control.parent as FormGroup;
        if (!groupControls) {
          return null;
        }

        const specificationControls = groupControls?.parent?.parent as FormArray;
        if (!specificationControls) {
          return null;
        }

        // find key of control
        const key = Object.keys(groupControls.controls).find(key => groupControls.controls[key] === control);
        if (!key) {
          return null;
        }

        const someSpecificationUseKey = (specificationControls?.controls as FormGroup[] | undefined)?.some((specification: FormGroup) => {
          return !!specification.get('columns')?.get(key)?.value;
        });
        
        return someSpecificationUseKey ? { required: true } : null;
      }
    }
  };

  /**
   * @returns the form controls of the specifications in the form, as an array of FormGroups
   */
  get specificationControls(): FormGroup[] {
    return (this.form.get('specifications') as FormArray).controls as FormGroup[];
  }

  /**
   * @param i18NextPipe the I18NextPipe to use
   * @param dialogConfig the dialog config to use
   * @param itemService the item service to use
   * @param suggestionService the suggestion service to use
   * @param formService the form service to use
   * @param store the store to use
   */
  constructor(
    private i18NextPipe: I18NextPipe,
    private dialogConfig: DynamicDialogConfig,
    protected itemService: ItemService,
    protected suggestionService: SuggestionService,
    private formService: FormService,
    private store: Store
  ) {
    this.dialogConfig.data.onSubmit = this.onSubmit.bind(this);
  }

  /**
   * Initializes the component with the provided data.
   *
   * @remarks
   * This function sets up the form controls, validators, and other necessary properties for the custom item dialog.
   * It also initializes the category, mode, and other form fields based on the provided data.
   *
   * @param i18NextPipe - The I18NextPipe to use for translations.
   * @param dialogConfig - The dialog config to use for passing data to the dialog.
   * @param itemService - The item service to use for fetching item data.
   * @param suggestionService - The suggestion service to use for fetching suggestion data.
   * @param formService - The form service to use for form validation.
   * @param store - The store to use for selecting the temporary settings.
   */
  ngOnInit(): void {
    this.editCustomItem = this.dialogConfig.data.customItem ?? null;
    this.customItems = this.dialogConfig.data.customItems ?? [];

    this.subscriptions.add(
      this.store.select(SettingsSelectors.selectTemporary).subscribe((settings) => {
        this.settings = settings;
      })
    );

    if (this.editCustomItem) {
      this.mode = this.dialogConfig.data.customItem.mode;
      this.initCategory(this.editCustomItem.category);

      this.form = new FormGroup({
        id: new FormControl(this.editCustomItem.id),
        category: new FormControl(this.category),
        typeId: new FormControl(this.editCustomItem.typeId, [Validators.required, this.Validators.DuplicateTypeIdValidator()]),
        name: new FormControl(this.editCustomItem.name, (this.mode === CustomItemMode.CUSTOM_ITEM) ? [Validators.required, Validators.minLength(1)] : []),
        unit: new FormControl({value: this.editCustomItem.unit, disabled: this.mode === CustomItemMode.OVERRIDE_ITEM}, [Validators.required]),
        mode: new FormControl(this.mode),
        specifications: new FormArray([])
      });

      this.updateColumns();

      for (const specification of this.editCustomItem.specifications) {
        this.addSpecification(specification);
      }


      if (this.mode === CustomItemMode.OVERRIDE_ITEM) {
        this.specificationControls.forEach((control) => {
          control.get('attributes')?.enable();
          control.get('attributes')?.get(AttributeName.WEIGHT)?.disable();
        });


        if (this.specificationControls.length > 0) {
          this.form.get('typeId')?.disable();
        }
      }
    } else {
      this.mode = this.dialogConfig.data.mode;
      this.initCategory(this.dialogConfig.data.category);
      const id = this.dialogConfig.data.id;

      this.form = new FormGroup({
        id: new FormControl(id),
        category: new FormControl(this.category),
        typeId: new FormControl((this.mode === CustomItemMode.CUSTOM_ITEM) ? (CUSTOM_ITEM_PREFIX + id) : null, [Validators.required, this.Validators.DuplicateTypeIdValidator()]),
        name: new FormControl(null, (this.mode === CustomItemMode.CUSTOM_ITEM) ? [Validators.required, Validators.minLength(1)] : []),
        unit: new FormControl({value: 'pcs', disabled: this.mode === CustomItemMode.OVERRIDE_ITEM}, [Validators.required]),
        mode: new FormControl(this.mode),
        specifications: new FormArray([])
      });

      this.updateColumns();
    }
  }

  /**
   * Unsubscribes from all subscriptions when the component is destroyed.
   *
   * @remarks
   * This function is called automatically when the component is destroyed.
   * It ensures that all subscriptions are properly cleaned up to prevent memory leaks.
   *
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Initializes the category and class type properties based on the provided item category.
   *
   * @param category - The item category to initialize the category property with.
   *
   * @remarks
   * This function sets the category and classType properties based on the provided item category.
   * It also creates a new instance of the classType using the typeIdDummyItem object.
   *
   * @returns {void}
   */
  private initCategory(category: ItemCategory): void {
    this.category = category;
    this.classType = getItemInstanceClassByCategory({ category: this.category });
    this.typeIdDummyItem = new (this.classType)({});
  }

  /**
   * Updates the columns property based on the category and typeId of the form.
   *
   * @remarks
   * This function is called when the component is initialized or when the category or typeId changes.
   * It fetches the relevant item columns using the `itemStructureResolver` function and filters out
   * hidden columns and columns that are not relevant for the current item.
   *
   * @returns {void}
   */
  private updateColumns(): void {
    const dummyItem = instanciateItem({
      category: this.form.get('category')?.value || this.category,
      typeId: this.form.get('typeId')?.value || '1000',
    });
    const itemColumns = itemStructureResolver(dummyItem.category).columns;
    console.log(itemColumns);
    this.itemColumns = itemColumns.filter(column => !column.hiddenForCustom && dummyItem.getRelevantColumnList().includes(column.itemKey));
  }

  /**
   * Handles the submission of the custom item dialog.
   *
   * @remarks
   * This function validates the form, creates a custom item object, and sets all empty values to null in the specification array.
   * It then assigns the custom item object to the `customItem` property of the `dialogConfig.data` object.
   *
   * @returns {boolean} - Returns `true` if the form is valid and the custom item object is successfully created.
   *                      Returns `false` if the form is invalid.
   */
  private onSubmit(): boolean {
    this.formService.validateForm(this.form);

    if (!this.form.valid) {
      return false;
    }

    const customItem = this.form.getRawValue();

    // set all empty values to null in the specification array
    customItem.specifications = customItem.specifications.map((specification: any) => {
      return this.itemColumns.reduce((acc: { [key: string]: any }, column) => {
        acc['columns'][column.itemKey] = specification['columns'][column.itemKey] || null;
        return acc;
      }, {
        columns: {},
        attributes: {
          [AttributeName.WEIGHT]: specification['attributes'][AttributeName.WEIGHT],
          [AttributeName.EFFORD_HOURS]: specification['attributes'][AttributeName.EFFORD_HOURS],
          [AttributeName.PRICE_MATERIAL]: specification['attributes'][AttributeName.PRICE_MATERIAL]
        }
      });
    });

    this.dialogConfig.data.customItem = customItem;
    return true;
  }

  /**
   * Handles the change of the typeId input in the custom item dialog.
   *
   * @remarks
   * This function is called when the user selects a new typeId from the suggestions dropdown.
   * It updates the name and unit fields of the form based on the selected typeId.
   *
   * @param suggestions - The array of suggestions containing the selected typeId.
   *
   * @returns {void}
   */
  onTypeChange(suggestions: OptionGroup[]): void {
    if (this.mode !== CustomItemMode.OVERRIDE_ITEM) {
      return;
    }

    const typeId = this.form.get('typeId')?.value;
    if (!typeId) {
      return;
    }

    const name = suggestions.reduce((acc: string, group) => {
      const item = group.items.find(item => item.value === typeId);
      if (item) {
        return item.label;
      }
      return acc;
    }, typeId);
    this.form.get('name')?.setValue(name);

    const dummyItem = new (this.classType)({ typeId });
    this.form.get('unit')?.setValue(dummyItem.getUnit());
    this.updateColumns();
  }

  /**
   * Deletes a specification at the specified index from the form.
   *
   * @remarks
   * This function removes the specification at the given index from the 'specifications' FormArray.
   * It also removes the corresponding dummy item from the 'dummyItems' array.
   * If there are no more specifications left in the form, it enables the 'typeId' form control.
   *
   * @param index - The index of the specification to delete.
   *
   * @returns {void}
   */
  deleteSpecification(index: number): void {
    (this.form.get('specifications') as FormArray).removeAt(index);
    this.dummyItems.splice(index, 1);

    if (this.specificationControls.length === 0) {
      this.form.get('typeId')?.enable();
    }
  }

  /**
   * Creates a FormGroup for a new specification in the custom item dialog.
   *
   * @param specification - The initial specification data. If not provided, default values will be used.
   *
   * @returns {FormGroup} - A FormGroup containing the columns and attributes form controls for the new specification.
   *
   * @remarks
   * This function creates a FormGroup with form controls for the columns and attributes of a new specification.
   * It applies validators and disables form controls based on the mode of the custom item dialog.
   * If the mode is 'OVERRIDE_ITEM', the attributes form control is disabled and the weight attribute is also disabled.
   * If the mode is 'CUSTOM_ITEM', the used column required validator is applied to the columns form controls.
   * If the mode is neither 'OVERRIDE_ITEM' nor 'CUSTOM_ITEM', no validators or disables are applied.
   */
  createSpecficationGroup(specification?: CustomItem['specifications'][0]): FormGroup {
    const newPriceSpecification = new FormGroup(
      this.itemColumns.reduce((acc: FormControlStructure, column, index, columns) => {
        const columnKey = column.itemKey;
        const control = new FormControl(specification?.['columns']?.[column.itemKey] ?? null, [
          this.mode === CustomItemMode.CUSTOM_ITEM ? this.Validators.UsedColumnRequiredValidator() : Validators.required
        ]);

        if (this.mode === CustomItemMode.OVERRIDE_ITEM) {
          if (index > 0) {
            const prevColumn = columns[index - 1];
            if (!acc.columns?.get(prevColumn.itemKey)?.value) {
              control.disable();
            }
          }
        }

        acc.columns.addControl(columnKey, control);
        return acc;
      }, {
        columns: new FormGroup({}),
        attributes: new FormGroup({
          [AttributeName.WEIGHT]: new FormControl(specification?.['attributes']?.[AttributeName.WEIGHT] ?? null, [Validators.required, Validators.min(0)]),
          [AttributeName.EFFORD_HOURS]: new FormControl(specification?.['attributes']?.[AttributeName.EFFORD_HOURS] ?? null, [Validators.required, Validators.min(0)]),
          [AttributeName.PRICE_MATERIAL]: new FormControl(specification?.['attributes']?.[AttributeName.PRICE_MATERIAL] ?? null, [Validators.required, Validators.min(0)])
        })
      }), [
        this.Validators.DuplicateSpecificationValidator(),
        ...(this.mode === CustomItemMode.CUSTOM_ITEM ? [
          this.Validators.OneColumnRequiredValidator()
        ] : [])
      ]
    );

    if (this.mode === CustomItemMode.OVERRIDE_ITEM) {
      newPriceSpecification.get('attributes')?.disable();
      newPriceSpecification.get('attributes')?.get(AttributeName.WEIGHT)?.disable();
    }
    return newPriceSpecification;
  }

  /**
   * Adds a new specification to the custom item dialog.
   *
   * @param specification - The initial specification data. If not provided, default values will be used.
   * @param atIndex - The index at which to insert the new specification. If not provided, the specification will be added at the end.
   * @param cloneDummyItemEntity - The dummy item entity to clone when creating a new specification.
   *
   * @returns {Promise<void>} - A promise that resolves when the new specification is added.
   *
   * @remarks
   * This function creates a new FormGroup for the new specification and adds it to the 'specifications' FormArray.
   * If the mode is 'CUSTOM_ITEM', the function creates a new FormGroup using the `createSpecficationGroup` method.
   * If the mode is not 'CUSTOM_ITEM', the function creates a new item entity, updates its attributes, and adds it to the 'dummyItems' array.
   * The function then updates the 'typeId' form control to be disabled and calls the `updateDummyItem` method to update the dummy item.
   * Finally, the function calls the `updateAttributes` method to update the attributes of the new specification.
   */
  async addSpecification(specification?: CustomItem['specifications'][0], atIndex?: number, cloneDummyItemEntity?: ItemEntity): Promise<void> {
    if (this.mode === CustomItemMode.CUSTOM_ITEM) {
      const newPriceSpecification = this.createSpecficationGroup(specification);
      if (atIndex !== undefined) {
        (this.form.get('specifications') as FormArray).insert(atIndex, newPriceSpecification);
      } else {
        (this.form.get('specifications') as FormArray)?.push(newPriceSpecification);
      }
      return;
    }

    let itemEntity = new (this.classType)(cloneDummyItemEntity ?? {
      typeId: this.form.get('typeId')?.value
    }, true);

    const newPriceSpecification = this.createSpecficationGroup(specification);
    for (const column of this.itemColumns) {
      const columnKey = column.itemKey;
      itemEntity[columnKey as keyof ItemEntity] = specification?.['columns']?.[columnKey] as any ?? null;
    }

    let rowIndex = atIndex ?? this.specificationControls.length;
    if (atIndex !== undefined) {
      (this.form.get('specifications') as FormArray).insert(atIndex, newPriceSpecification);
      this.dummyItems.splice(atIndex, 0, itemEntity);
    } else {
      this.dummyItems.push(itemEntity);
      (this.form.get('specifications') as FormArray)?.push(newPriceSpecification);
    }

    this.form.get('typeId')?.disable();

    const previousDummyItem = this.dummyItems[rowIndex];
    const newDummyItem = await this.updateDummyItem(rowIndex);
    this.updateAttributes(newPriceSpecification.get('attributes') as FormGroup, newDummyItem, previousDummyItem);
  }

  /**
   * Duplicates the specification at the specified index in the custom item dialog.
   *
   * @param index - The index of the specification to duplicate.
   *
   * @returns {Promise<void>} - A promise that resolves when the specification is duplicated.
   *
   * @remarks
   * This function retrieves the specification at the given index from the `specificationControls` array.
   * It then calls the `addSpecification` method to add a new specification at the next index,
   * using the raw value of the retrieved specification and the dummy item at the given index.
   */
  async duplicateSpecification(index: number): Promise<void> {
    const specification = this.specificationControls[index];
    this.addSpecification(specification.getRawValue(), index + 1, this.dummyItems[index]);
  }

  /**
   * Updates the next controls in the custom item dialog based on the current column and row index.
   *
   * @param rowIndex - The index of the row in the specifications array.
   * @param control - The FormGroup containing the columns and attributes form controls for the current specification.
   * @param itemColumn - The ItemColumn object representing the current column.
   *
   * @returns {Promise<void>} - A promise that resolves when the next controls are updated.
   *
   * @remarks
   * This function is called when the user interacts with the columns form controls in the custom item dialog.
   * It enables or disables the next column form control based on the current column and row index.
   * It also updates the attributes form controls based on the calculated values from the new dummy item.
   */
  async updateNextControls(rowIndex: number, control: FormGroup, itemColumn: ItemColumn): Promise<void> {
    if (this.mode === CustomItemMode.CUSTOM_ITEM) {
      return;
    }

    const itemKey = itemColumn.itemKey as keyof ItemEntity;
    const columnIndex = this.itemColumns.findIndex(column => column.itemKey === itemKey);
    const columnsControl = control.get('columns') as FormGroup;
    const currentControl = columnsControl.get(itemKey);

    if (currentControl?.value) {
      if (columnIndex < this.itemColumns.length - 1) {
        const nextColumn = this.itemColumns[columnIndex + 1];
        const nextControl = columnsControl.get(nextColumn.itemKey);
        nextControl?.enable();
      }
    }

    for (let i = columnIndex + 1; i < this.itemColumns.length; i++) {
      const nextColumn = this.itemColumns[i];
      const nextControl = columnsControl.get(nextColumn.itemKey);
      if(i > columnIndex + 1 || !currentControl?.value) {
        nextControl?.disable();
      }
      nextControl?.setValue(null);
    }

    const previousDummyItem = this.dummyItems[rowIndex];
    const newDummyItem = await this.updateDummyItem(rowIndex);
    this.updateAttributes(control.get('attributes') as FormGroup, newDummyItem, previousDummyItem);
  }

  /**
   * Updates the dummy item at the specified row index in the custom item dialog.
   *
   * @remarks
   * This function is called when the user interacts with the columns form controls in the custom item dialog.
   * It creates a new instance of the classType using the dummy item at the given row index, updates its attributes based on the columns form controls,
   * and calculates the item attributes using the itemService.
   *
   * @param rowIndex - The index of the row in the specifications array.
   *
   * @returns {Promise<ItemEntity>} - A promise that resolves with the updated dummy item.
   *
   * @throws {Error} - If the mode is CUSTOM_ITEM, an error is thrown indicating that the dummy item cannot be updated in this mode.
   */
  private async updateDummyItem(rowIndex: number): Promise<ItemEntity> {
    if (this.mode === CustomItemMode.CUSTOM_ITEM) {
      throw new Error('Cannot update dummy item in CUSTOM_ITEM mode');
    }

    const newDummyItem = new (this.classType)(this.dummyItems[rowIndex]);
    const columnsControl = this.specificationControls[rowIndex].get('columns') as FormGroup;

    for (const column of this.itemColumns) {
      const columnKey = column.itemKey;
      newDummyItem[columnKey as keyof ItemEntity] = columnsControl.get(columnKey)?.value ?? null;
    }

    await this.itemService.calculateItem(newDummyItem);
    this.dummyItems[rowIndex] = newDummyItem;
    return newDummyItem;
  }

  /**
   * Updates the attributes form controls based on the new dummy item and previous dummy item.
   *
   * @remarks
   * This function is called when the user interacts with the columns form controls in the custom item dialog.
   * It enables or disables the attributes form controls based on the calculated attribute of the new dummy item.
   * It also disables the weight attribute form control.
   * Then, it iterates through each attribute key in the attributes form controls and updates its value based on the calculated attribute of the new dummy item.
   * If the current value is not set or matches the previous dummy value, it sets the value to the calculated attribute of the new dummy item.
   *
   * @param attributesControl - The FormGroup containing the attributes form controls for the current specification.
   * @param newDummyItem - The new dummy item created based on the columns form controls.
   * @param previousDummyItem - The previous dummy item before updating the attributes form controls.
   *
   * @returns {void}
   */
  private updateAttributes(attributesControl: FormGroup, newDummyItem: ItemEntity, previousDummyItem: ItemEntity): void {
    if (this.mode === CustomItemMode.CUSTOM_ITEM) {
      return;
    }

    const isCalculated = newDummyItem.getAttribute(AttributeName.IS_CALCULATED);
    attributesControl?.[isCalculated ? 'enable' : 'disable']();
    attributesControl?.get(AttributeName.WEIGHT)?.disable();

    const attributeKeys = Object.keys(attributesControl.getRawValue());
    for (const attributeKey of attributeKeys) {
      const currentValue = attributesControl?.get(attributeKey)?.value as number ?? null;
      const previousDummyValue = previousDummyItem?.getAttribute(attributeKey as AttributeName) as number ?? undefined;

      const currentValueNumber = typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue;
      const previousDummyValueNumber = typeof previousDummyValue === 'number' ? parseFloat(previousDummyValue.toFixed(2)) : previousDummyValue;

      if (!currentValue || (previousDummyValue && currentValue && (safeEquals(currentValueNumber, previousDummyValueNumber)))) {
        attributesControl?.get(attributeKey)?.setValue(isCalculated ? (newDummyItem.getAttribute(attributeKey as AttributeName) as number).toFixed(2) : null);
      }
    }
  }

  /**
   * Retrieves a placeholder for the given column name using the i18NextPipe.
   *
   * @param column - The name of the column for which the placeholder is required.
   *
   * @returns {string} - The placeholder for the given column name.
   *
   * @remarks
   * This function uses the i18NextPipe to transform the given column name into a placeholder.
   * The i18NextPipe is assumed to be injected into the component using Angular's dependency injection.
   */
  getPlaceholder(column: string): string {
    return this.i18NextPipe.transform(column);
  }

}