import { Injectable } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { I18NextPipe } from 'angular-i18next';
import { cloneDeep, get } from 'lodash';
import { Formula, FormulaAttribute, FormulaCondition } from '../../interfaces/formula.interface';
import { ControlFormulaEditComponent } from '../../components/controls/settings/controls/formula/edit/control-formula-edit.component';
import { DialogTemplateFooterComponent } from '../../components/dialog-templates/footer/dialog-template-footer.component';
import { safeEquals } from '@common/utils/operations.util';
import { FunctionNode, parse, re, SymbolNode } from 'mathjs';
import { AbstractControl } from '@angular/forms';
import { ItemPipeFittingEntity } from '@common/entities/item/items/pipe-fitting.entity';
import { AttributeName } from '@common/interfaces/attribute.interface';
import { Store } from '@ngrx/store';
import * as SettingsSelectors from '../../store/selectors/settings.selector';
import * as SettingsActions from '../../store/actions/settings.action';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { ItemEntity } from '@common/entities/item/item.entity';
import { CONDITION_CONFIG } from 'src/app/consts/formula.const';


type Paths<T> = T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${"" | `.${Paths<T[K]>}`}`;
    }[keyof T]
  : never;

/**
 * This function is used to ensure that the types of two values are the same.
 * If the types are different, it converts the second value to match the type of the first value.
 *
 * @template T - The type of the values to be compared. It should be either `string` or `number`.
 * @param val1 - The first value to compare.
 * @param val2 - The second value to compare.
 * @returns The second value, converted to match the type of the first value if necessary.
 *
 * @example
 * ```typescript
 * const num1: number = 10;
 * const str2: string = "20";
 * const result = equalizeType(num1, str2); // result will be 20 (converted from string to number)
 * ```
 */
function equalizeType<T extends string | number>(
  val1: T,
  val2: string | number
): T {
  if (typeof val1 === "string" && typeof val2 === "number") {
    return val2.toString() as T;
  }
  if (typeof val1 === "number" && typeof val2 === "string") {
    if (val2.includes(".")) {
      return parseFloat(val2) as T;
    }
    return parseInt(val2, 10) as T;
  }
  return val2 as T;
}

const CONDITION_COMPARISONS: {
  [key: string]: (val1: any, val2: any) => boolean;
} = {
  eq: (val1: any, val2: any) => safeEquals(val1, equalizeType(val1, val2)),
  gt: (val1: any, val2: any) => val1 > equalizeType(val1, val2),
  lt: (val1: any, val2: any) => val1 < equalizeType(val1, val2),
  neq: (val1: any, val2: any) => !safeEquals(val1, equalizeType(val1, val2)),
  gte: (val1: any, val2: any) => val1 >= equalizeType(val1, val2),
  lte: (val1: any, val2: any) => val1 <= equalizeType(val1, val2),
};

@Injectable({
  providedIn: "root",
})
export class FormulaService {

  private readonly VALUE_REPLACEMENTS: { [key: string]: (item: ItemPipeFittingEntity) => number | null } = {
    'D1': (item) => item.dn1,
    'D2': (item) => item.dn2,
    'S1': (item) => item.s1,
    'S2': (item) => item.s2,
    'QUANTITY': (item) => item.quantity,
    'MENGE': (item) => item.quantity,
    'WEIGHT': (item) => item.getAttribute(AttributeName.WEIGHT) as number || null,
    'GEWICHT': (item) => item.getAttribute(AttributeName.WEIGHT) as number || null,
    'EFFORD_HOURS': (item) => item.getAttribute(AttributeName.EFFORD_HOURS) as number || null,
    'AUFWAND_STUNDEN': (item) => item.getAttribute(AttributeName.EFFORD_HOURS) as number || null,
    'PRICE_MATERIAL': (item) => item.getAttribute(AttributeName.PRICE_MATERIAL) as number || null,
    'PREIS_MATERIAL': (item) => item.getAttribute(AttributeName.PRICE_MATERIAL) as number || null
  };

  public readonly FormulaValidator = (control: AbstractControl) => {
    if (control.value && !this.isValidFormula(control.value)) {
      return { formula: true };
    }
    return null;
  };

  /**
   * @param dialogService The dialog service to show the formula editor dialog.
   * @param i18NextPipe The i18next pipe to translate the error messages.
   * @param store The ngrx store to dispatch the change formula action.
   */
  constructor(
    private dialogService: DialogService,
    private i18NextPipe: I18NextPipe,
    private store: Store
  ) {
    SymbolNode.onUndefinedSymbol = (name) => {
      throw new Error(this.i18NextPipe.transform('error:formula.missing-symbol', { name }));
    };
    FunctionNode.onUndefinedFunction = (name) => {
      throw new Error(this.i18NextPipe.transform('error:formula.missing-function', { name }));
    };
  }

  /**
   * Validates a mathematical formula to ensure it is syntactically correct and can be evaluated.
   *
   * @param formula - The mathematical formula to validate.
   * @returns `true` if the formula is valid, `false` otherwise.
   *
   * @remarks
   * This function uses the `mathjs` library to parse and evaluate the formula.
   * It replaces any commas in the formula with periods to ensure proper decimal parsing.
   * If the formula is syntactically correct, the function returns `true`.
   * If the formula contains any undefined symbols or functions, an error is thrown, and the function returns `false`.
   *
   * @example
   * ```typescript
   * const isValid = isValidFormula("2 + 2 * 2"); // Returns true
   * const isValid = isValidFormula("2 + 2 * (2"); // Returns false
   * ```
   */
  public isValidFormula(formula: string): boolean {
    try {
      formula = formula.replace(',', '.');
      const parsed = parse(`RESULT = number(${formula})`);
      const compiled = parsed.compile();
      const scope = Object.keys(this.VALUE_REPLACEMENTS).reduce((acc, key) => {
        acc[key] = 1.0;
        return acc;
      }, {} as any);
      compiled.evaluate(scope);
      if (typeof scope.RESULT === "undefined") {
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * Evaluates a mathematical formula using the provided item entity and the defined value replacements.
   *
   * @param formula - The mathematical formula to evaluate.
   * @param itemEntity - The item entity to use for value replacements.
   *
   * @returns The result of the evaluated formula, or `null` if the formula is invalid or the result is not a number.
   *
   * @remarks
   * This function replaces any commas in the formula with periods to ensure proper decimal parsing.
   * It then creates a scope object with the defined value replacements and evaluates the formula using the `mathjs` library.
   * If the result is a number, it is returned as is.
   * If the result is not a number or is `null`, `null` is returned.
   */
  private evaluateFormula(formula: string, itemEntity: ItemPipeFittingEntity): number | null {
    formula = formula.replace(',', '.');
    const scope = Object.keys(this.VALUE_REPLACEMENTS).reduce(
      (acc, key: any) => {
        acc[key] = this.VALUE_REPLACEMENTS[key](itemEntity)
        return acc;
      }, {} as Record<string, number | null>
    ) as any;

    Object.keys(scope).forEach(
      (key) => scope[key] === null && delete scope[key]
    );

    const parsed = parse(`RESULT = number(${formula})`);
    const compiled = parsed.compile();
    compiled.evaluate(scope)

    if (typeof scope.RESULT?.toNumber === "function") {
      return scope.RESULT.toNumber();
    }

    if (
      typeof scope.RESULT !== "number" ||
      scope.RESULT === null ||
      isNaN(scope.RESULT)
    ) {
      return null;
    }

    return scope.RESULT;
  }

  /**
   * Applies formulas to an item entity based on the defined conditions and calculations.
   *
   * @param itemEntity - The item entity to apply the formulas to.
   *
   * @remarks
   * This function iterates through the defined formulas in the settings.
   * For each formula, it checks if the formula is active and if the conditions match the item entity.
   * If the conditions match, it evaluates the calculations and updates the item entity's attributes.
   * The applied formulas are stored in the item entity's attribute.
   * If an error occurs during the application of a formula, it is logged and added to the item entity's errors attribute.
   */
  public async apply(itemEntity: ItemPipeFittingEntity): Promise<void> {
    const appliedFormulas = itemEntity.getAttribute(AttributeName.FORMULAS) as FormulaAttribute[] ?? [];

   

    const settings = await firstValueFrom(this.store.select(SettingsSelectors.selectApplied));
    const formulas = settings.formulas;

    for (let formula of formulas) {
      if (!formula.active) {
        continue;
      }

      const conditionMatches = formula.conditions.every(
        (condition: FormulaCondition) => {
          if (
            !condition.option ||
            !condition.operation ||
            condition.value === null
          ) {
            return false;
          }

          const compareFunction = CONDITION_COMPARISONS[condition.operation];
          if (typeof compareFunction === "undefined") {
            console.warn(
              "Unknown or unmatched comparison operator:",
              condition.operation
            );
            return false;
          }

          const pipeFittingValue = this.getValueForCondition(itemEntity, condition.option);
          if (typeof pipeFittingValue === "undefined") {
            console.warn("Unknown or unmatched option:", condition.option);
            return false;
          }

          return compareFunction(pipeFittingValue, condition.value);
        }
      );

      if (!conditionMatches) {
        continue;
      }

      try {
        const formulas: { [key: string]: string } = {};
        let changes: FormulaAttribute['changes'] = {
          [AttributeName.EFFORD_HOURS]: { before: 0, after: 0, value: 0},
          [AttributeName.PRICE_MATERIAL]: { before: 0, after: 0, value: 0},
          [AttributeName.PRICE_MANUFACTURING]: { value: 0 },
          [AttributeName.PRICE_ASSEMBLY]: { value: 0 },
          [AttributeName.PRICE_EFFORD]: { value: 0 }
        };

        changes[AttributeName.EFFORD_HOURS].before = itemEntity.getAttribute(AttributeName.EFFORD_HOURS) as number;

        changes[AttributeName.PRICE_MATERIAL].before = itemEntity.getAttribute(AttributeName.PRICE_MATERIAL) as number;

        const effordHours = (typeof formula.calculation.effordHours === 'string' && formula.calculation?.effordHours.trim().length > 0) ?
          this.evaluateFormula(
            formula.calculation.effordHours,
            itemEntity
          ) : null;

        if (effordHours !== null) {
          itemEntity.setAttribute(AttributeName.EFFORD_HOURS, effordHours);
          formulas[AttributeName.EFFORD_HOURS] = formula.calculation.effordHours as string;
        }

        const priceMaterial = (typeof formula.calculation.priceMaterial === 'string' && formula.calculation?.priceMaterial.trim().length > 0) ?
          this.evaluateFormula(
            formula.calculation.priceMaterial,
            itemEntity
          ) : null;

        if (priceMaterial !== null) {
          itemEntity.setAttribute(AttributeName.PRICE_MATERIAL, priceMaterial);
          formulas[AttributeName.PRICE_MATERIAL] = formula.calculation.priceMaterial as string;
        }

        changes[AttributeName.EFFORD_HOURS].after = itemEntity.getAttribute(AttributeName.EFFORD_HOURS) as number;
        changes[AttributeName.PRICE_MATERIAL].after = priceMaterial as number;

        changes[AttributeName.EFFORD_HOURS].value = changes[AttributeName.EFFORD_HOURS].after - changes[AttributeName.EFFORD_HOURS].before;
        changes[AttributeName.PRICE_MATERIAL].value = changes[AttributeName.PRICE_MATERIAL].after - changes[AttributeName.PRICE_MATERIAL].before;
        
        if (effordHours !== null || priceMaterial !== null) {
          appliedFormulas.push({
            id: formula.id,
            name: formula.name,
            formulas,
            changes
          });
        }
        
        itemEntity.setAttribute(AttributeName.FORMULAS, appliedFormulas);
      } catch (e) {
        console.error("Error while applying formula", e);

        const errors = itemEntity.getAttribute(AttributeName.ERRORS) as string[] ?? [];
        itemEntity.setAttribute(AttributeName.ERRORS, [
          ...errors,
          { message: this.i18NextPipe.transform('error:formula.apply-error-message', { name: formula.name, message: (e as Error).message }) }
        ]);
      }
    }
  }

  /**
   * Opens a dialog to edit a formula in the settings.
   *
   * @param editFormula - The formula to be edited.
   *
   * @remarks
   * This function retrieves the temporary settings, finds the formula to be edited,
   * and opens a dialog to edit the formula. If the user confirms the changes,
   * the updated formula is applied to the settings.
   *
   * @returns A promise that resolves when the dialog is closed.
   */
  public async showEditDialog(editFormula: Formula): Promise<void> {
    const settings = await firstValueFrom(this.store.select(SettingsSelectors.selectTemporary));
    const formulas = settings.formulas;

    const formula = cloneDeep(formulas.find((f) => f.id === editFormula.id));
    
    if (!formula) {
      return;
    }

    const dialogRef = this.dialogService.open(ControlFormulaEditComponent, {
      header: this.i18NextPipe.transform(
        "components.controls.settings.controls.formula-edit.title.edit"
      ),
      width: "50vw",
      templates: {
        footer: DialogTemplateFooterComponent,
      },
      data: {
        buttons: {
          confirm: this.i18NextPipe.transform(
            "components.controls.settings.controls.formula-edit.button.confirm"
          ),
          cancel: this.i18NextPipe.transform(
            "components.controls.settings.controls.formula-edit.button.cancel"
          ),
        },
        formula
      }
    });

    dialogRef.onClose.subscribe((result?: { confirmed: boolean; data: any }) => {
      if (result?.confirmed) {
        this.store.dispatch(SettingsActions.update({
          settings: {
            ...settings,
            formulas: formulas.map((f) => (f.id === formula.id ? result.data.formula : f))
          }
        }));
      }
    });
  }

  /**
   * Opens a dialog to create a new formula in the settings.
   *
   * @remarks
   * This function creates a new formula object with default values and opens a dialog to edit it.
   * If the user confirms the changes, the new formula is added to the settings.
   *
   * @returns A promise that resolves when the dialog is closed.
   */
  public showCreateDialog(): void {
    const dialogRef = this.dialogService.open(ControlFormulaEditComponent, {
      header: this.i18NextPipe.transform(
        "components.controls.settings.controls.formula-edit.title.create"
      ),
      width: "50vw",
      templates: {
        footer: DialogTemplateFooterComponent,
      },
      data: {
        buttons: {
          confirm: this.i18NextPipe.transform(
            "components.controls.settings.controls.formula-edit.button.confirm"
          ),
          cancel: this.i18NextPipe.transform(
            "components.controls.settings.controls.formula-edit.button.cancel"
          ),
        },
        formula: {
          id: uuidv4(),
          name: this.i18NextPipe.transform(
            "components.controls.settings.controls.formula-edit.default.name"
          ),
          active: true,
          conditions: [
            {
              option: undefined,
              operation: undefined,
              value: undefined,
            },
          ],
          calculation: {
            effordHours: undefined,
            priceMaterial: undefined,
          }
        }
      }
    });

    dialogRef.onClose.subscribe(async (result?: { confirmed: boolean; data: any }) => {
      if (result?.confirmed) {
        const settings = await firstValueFrom(this.store.select(SettingsSelectors.selectTemporary));
        const formulas = settings.formulas;
  
        this.store.dispatch(SettingsActions.update({
          settings: {
            ...settings,
            formulas: [...formulas, result.data.formula]
          }
        }));
      }
    });
  }

  /**
   * Retrieves the value for a specific condition key from the given item entity.
   *
   * @param item - The item entity from which to retrieve the value.
   * @param conditionKey - The key of the condition for which to retrieve the value.
   *
   * @returns The value for the specified condition key, or `undefined` if the condition key is not found.
   *
   * @remarks
   * This function uses the `CONDITION_CONFIG` array to find the condition with the specified key.
   * If the condition is found and its source is 'key', it retrieves the value from the item entity using the `get` function.
   * If the condition is found and its source is 'attributes', it retrieves the value from the item entity using the `getAttribute` method.
   * If the condition is not found, it returns `undefined`.
   */
  private getValueForCondition(item: ItemEntity, conditionKey: string) {
    const condition = CONDITION_CONFIG.find((c) => c.key === conditionKey);
    if (!condition) {
      return undefined;
    }

    if (condition.source === 'key') {
      return get(item, conditionKey);
    }

    if (condition.source === 'attributes') {
      return item.getAttribute(conditionKey as AttributeName);
    }
  }
}
