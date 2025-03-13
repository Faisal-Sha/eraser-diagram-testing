import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ITEM_UNIT_LABEL_MAP, ItemEntity } from '@common/entities/item/item.entity';
import { isItemCalculationColumn, ItemColumn } from '@common/interfaces/items/item-structure.interface';
import { I18NEXT_SCOPE, I18NextModule, I18NextPipe } from 'angular-i18next';
import { Dropdown, DropdownModule } from 'primeng/dropdown';
import { Inplace, InplaceModule } from 'primeng/inplace';
import { InputNumber, InputNumberModule } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import { CustomItemService } from 'src/app/services/custom-item/custom-item.service';
import { SuggestionList, SuggestionService } from 'src/app/services/suggestion/suggestion.service';
import { PrimeTemplate } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet, AsyncPipe, NgClass } from '@angular/common';
import { ItemService } from 'src/app/services/item/item.service';

@Component({
    selector: 'app-control-calculation-cell',
    templateUrl: './control-calculation-cell.component.html',
    styleUrls: ['./control-calculation-cell.component.scss'],
    providers: [{
      provide: I18NEXT_SCOPE,
      useValue: 'components.controls.calculation.cell'
    }],
    standalone: true,
    imports: [
      NgTemplateOutlet, 
      NgClass,
      FormsModule, 
      InputNumberModule, 
      DropdownModule, 
      InplaceModule,
      PrimeTemplate, 
      I18NextModule,
      AsyncPipe
    ]
})
export class ControlCalculationCellComponent implements OnDestroy, OnChanges, AfterViewInit {
  @ViewChild('inplaceEditor') inplaceEditor!: Inplace;
  @ViewChildren('input') input!: QueryList<InputNumber | InputText | Dropdown>;

  @Input() model: any;
  @Output() modelChange = new EventEmitter<any>();

  @Input() item!: ItemEntity;
  @Input() itemColumn!: ItemColumn;

  // Workaround for detecting typeId changes to trigger ngOnChanges
  @Input() updateTrigger!: any;

  protected displayText: string = '...';
  protected hasValue = true;

  protected loading = false;
  protected suggestions: {
    options: SuggestionList;
    grouped: boolean;
  } | null = null;

  private subscriptions = new Subscription();

  /**
   * Creates an instance of ControlCalculationCellComponent.
   * @param customItemService required for retrieving custom items
   * @param suggestionService required for retrieving suggestions
   * @param i18NextPipe required for translating text
   * @param itemService required for loading items
   */
  constructor(
    private customItemService: CustomItemService,
    private suggestionService: SuggestionService,
    private i18NextPipe: I18NextPipe,
    private itemService: ItemService
  ) {
  }

  ngOnInit(): void {
    
  }

  /**
   * Initializes the component after the view has been initialized.
   * Focuses the input when the inplace editor is activated.
   */
  ngAfterViewInit(): void {
    // Focus the input when the inplace editor is activated
    this.subscriptions.add(this.input.changes.subscribe(() => {
      requestAnimationFrame(() => {
        const input = this.input.first;
        if (input instanceof InputNumber || input instanceof InputText) {
          const inputElement = (input as any)?.input as ElementRef<HTMLInputElement>;
          inputElement.nativeElement.focus();
        } else if (input instanceof Dropdown) {
          input.show();
        }
      });
    }));
  }

  /**
   * Cleans up any subscriptions when the component is destroyed.
   * This is important to prevent memory leaks and ensure proper cleanup.
   *
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions?.unsubscribe();
  }

  /**
   * Handles changes to the input model and updates the display text and hasValue properties.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the changes are processed.
   */
  async ngOnChanges(): Promise<void> {
    // Update the display text based on the current model value
    this.displayText = await this.getDisplayText();

    // Determine if the model has a valid value (not null or undefined)
    this.hasValue = !(this.model === null || typeof this.model === 'undefined');
  }

  /**
   * Checks if the specified item column is available for the current item.
   *
   * @returns {boolean} - True if the item column is available, false otherwise.
   *
   * @remarks
   * This function determines the availability of an item column based on the item's type (custom or standard)
   * and the item column's key. For custom items, it uses the `CustomItemService` to check the availability
   * of the custom item column. For standard items, it directly checks the availability of the item column.
   *
   * @example
   * ```typescript
   * const isColumnAvailable = this.isItemColumnAvailable();
   * console.log(isColumnAvailable); // Output: true or false
   * ```
   */
  protected isItemColumnAvailable(): boolean {
    if (this.item.isCustom()) {
      return this.customItemService.isCustomItemColumnAvailable(this.item, this.itemColumn.itemKey);
    }
    return this.item.isColumnAvailable(this.itemColumn.itemKey);
  }

  /**
   * Retrieves suggestions for the current item column based on the provided item and column key.
   *
   * @async
   * @param item - The item for which suggestions are being retrieved.
   * @param itemKey - The key of the item column for which suggestions are being retrieved.
   * @param includeGroups - A flag indicating whether to include grouped suggestions.
   * @returns A promise that resolves to an object containing the suggestion options and a boolean indicating whether the suggestions are grouped.
   *
   * @remarks
   * This function retrieves suggestions for the specified item column by calling the `getColumnSuggestions` method of the `SuggestionService`.
   * It then processes the suggestions to determine if they are grouped and formats the options accordingly.
   *
   * @example
   * ```typescript
   * const suggestions = await this.getSuggestions();
   * console.log(suggestions.options); // Output: Array of suggestion options
   * console.log(suggestions.grouped); // Output: Boolean indicating whether the suggestions are grouped
   * ```
   */
  private async getSuggestions(): Promise<{
    options: SuggestionList;
    grouped: boolean;
  }> {
    const result = {
      options: [] as any,
      grouped: false
    };

    const columnSuggestions = await this.suggestionService.getColumnSuggestions(this.item, this.itemColumn.itemKey, true);
    result.grouped = columnSuggestions.some(s => s.group);

    if (result.grouped) {
      const groups = columnSuggestions.reduce((acc: string[], s: any) => {
        if (s.group && !acc.includes(s.group)) {
          acc.push(s.group);
        }
        return acc;
      }, []);

      result.options = groups.map(group => ({
        label: this.i18NextPipe.transform(`pipefittings.group.${this.itemColumn.itemKey}.${group}`),
        items: columnSuggestions.filter(s => s.group === group).map(s => ({
          label: s.label,
          value: s.value
        }))
      }));

      return result;
    }

    result.options = columnSuggestions.map(s => ({
      label: s.label,
      value: s.value
    }));
    return result;
  }

  /**
   * Retrieves and formats the display text for the current item column based on its view renderer type.
   *
   * @async
   * @returns {Promise<string>} A promise that resolves to the formatted display text.
   *
   * @remarks
   * This function checks the type of the view renderer associated with the current item column.
   * Depending on the renderer type, it calls the corresponding rendering function to format the display text.
   * If the item column is not a calculation column, it defaults to rendering the display text.
   *
   * @example
   * ```typescript
   * const displayText = await this.getDisplayText();
   * console.log(displayText); // Output: Formatted display text based on the item column's view renderer type
   * ```
   */
  private async getDisplayText(): Promise<string> {
    if (isItemCalculationColumn(this.itemColumn)) {
      switch (this.itemColumn.viewRenderer.type) {
        case 'number':
          return this.renderDisplayNumber();
        case 'text':
          return this.renderDisplayText();
        case 'suggestion':
          return this.renderDisplaySuggestion();
      }
    }
    return this.renderDisplayText();
  }

  /**
   * Renders the display text for the current item column, specifically for number view renderer type.
   *
   * @async
   * @returns {Promise<string>} A promise that resolves to the formatted display text.
   *
   * @remarks
   * This function checks if the current item column is a calculation column and if the view renderer type is 'number'.
   * If the conditions are met, it processes the model value to format it as a localized string with the specified number of decimal places.
   * If the item column key is 'quantity', it appends the translated unit label to the display text.
   *
   * @param {void} - No parameters are required for this function.
   *
   * @example
   * ```typescript
   * const displayText = await this.renderDisplayNumber();
   * console.log(displayText); // Output: Formatted display text based on the item column's view renderer type
   * ```
   */
  private async renderDisplayNumber(): Promise<string> {
    if (!isItemCalculationColumn(this.itemColumn)) {
      return '-';
    }

    const viewRenderer = this.itemColumn.viewRenderer;
    if (viewRenderer.type !== 'number') {
      return '-';
    }

    let value: number = this.model;
    if (typeof value === 'string') {
      value = parseFloat(value);
    }

    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
      return '-';
    }

    let stringValue = value.toLocaleString('de-DE', { maximumFractionDigits: viewRenderer.maxDecimals, minimumFractionDigits: viewRenderer.minDecimals });

    if(this.itemColumn.itemKey === 'quantity') { 
      const unit = this.itemService.getUnit(this.item);
      const translatedUnit = this.i18NextPipe.transform(ITEM_UNIT_LABEL_MAP[unit] ?? '');
      stringValue += translatedUnit.length ? ' '+translatedUnit : '';
    }

    return stringValue;
  }

  /**
   * Renders the display text for the current item column, specifically for text view renderer type.
   *
   * @async
   * @returns {Promise<string>} A promise that resolves to the formatted display text.
   *
   * @remarks
   * This function checks if the current item column is a calculation column and if the view renderer type is 'text'.
   * If the conditions are met, it simply returns the model value as the display text.
   *
   * @param {void} - No parameters are required for this function.
   *
   * @example
   * ```typescript
   * const displayText = await this.renderDisplayText();
   * console.log(displayText); // Output: Formatted display text based on the item column's view renderer type
   * ```
   */
  private async renderDisplayText(): Promise<string> {
    return this.model;
  }

  /**
   * Renders the display text for the current item column, specifically for suggestion view renderer type.
   *
   * @async
   * @returns {Promise<string>} A promise that resolves to the formatted display text.
   *
   * @remarks
   * This function checks if the current item column is a calculation column and if the view renderer type is 'suggestion'.
   * If the conditions are met, it retrieves suggestions for the item column, processes them, and returns the corresponding display text.
   * If the suggestions are grouped, it flattens them before searching for the matching value.
   * If no matching value is found, it returns the original model value.
   *
   * @param {void} - No parameters are required for this function.
   *
   * @example
   * ```typescript
   * const displayText = await this.renderDisplaySuggestion();
   * console.log(displayText); // Output: Formatted display text based on the item column's view renderer type
   * ```
   */
  private async renderDisplaySuggestion(): Promise<string> {
    if (!isItemCalculationColumn(this.itemColumn)) {
      return '-';
    }

    const suggestions = await this.getSuggestions();
    let options = suggestions.options;
    const grouped = suggestions.grouped;

    const value = this.model;
    if (!options || options.length === 0) {
      return value;
    }

    if (grouped) {
      // flatten the grouped suggestions
      options = options.reduce((acc: any[], group: any) => {
        return acc.concat(group.items);
      }, []);
    }

    const option = options.find(o => o.value === value);
    return option ? option.label : value;
  }

  /**
   * Deactivates the inplace editor and emits the updated model value.
   * Also resets the suggestions to null.
   *
   * @returns {void} - No return value.
   *
   * @remarks
   * This function is called when the inplace editor is deactivated.
   * It deactivates the inplace editor, emits the updated model value using the `modelChange` event emitter,
   * and resets the suggestions to null.
   *
   * @example
   * ```typescript
   * this.deactivate();
   * ```
   */
  protected deactivate(): void {
    this.inplaceEditor.deactivate();
    this.modelChange.emit(this.model);

    this.suggestions = null;
  }

  /**
   * Activates the inplace editor based on the item column's editor renderer type.
   * If the item column is a calculation column and the editor renderer type is 'suggestion',
   * it retrieves suggestions for the item column and sets the loading state to true.
   *
   * @returns {void} - No return value.
   *
   * @remarks
   * This function is called when the inplace editor is activated.
   * It checks the item column's type and editor renderer type to determine the necessary actions.
   * If the item column is a calculation column and the editor renderer type is 'suggestion',
   * it sets the loading state to true, retrieves suggestions using the `getSuggestions` method,
   * and updates the suggestions when the promise resolves.
   *
   * @example
   * ```typescript
   * this.activate();
   * ```
   */
  protected activate(): void {
    if (!isItemCalculationColumn(this.itemColumn)) {
      return;
    }

    if (this.itemColumn.editorRenderer.type === 'suggestion') {
      this.loading = true;
      this.getSuggestions().then(suggestions => {
        this.suggestions = suggestions;
        this.loading = false;
      });
    }
  }
}
