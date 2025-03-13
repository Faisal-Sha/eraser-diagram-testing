import { ItemEntity } from "@common/entities/item/item.entity";
import { AttributeName } from "@common/interfaces/attribute.interface";
import { Store } from "@ngrx/store";
import { firstValueFrom } from "rxjs";
import * as SettingsSelectors from '../store/selectors/settings.selector';
import { ChangesEntity, FormulaAttribute, FormulaTotalsAttribute } from "../interfaces/formula.interface";
import { Settings } from "../interfaces/settings.interface";
import { ItemGroupEntity } from "@common/entities/item/items/group.entity";
import { cloneDeep } from "lodash";

interface SplitResults {
  manufacturingPrice: number;
  assemblyPrice: number;
}


/**
 * This function expands the calculation of a group by iterating through its items and formulas.
 * It calculates the total formula changes for each attribute (material, effort, manufacturing, assembly, total)
 * and updates the group's attributes accordingly.
 *
 * @param group - The item group for which the calculation needs to be expanded.
 *
 * @returns {void} - The function does not return any value.
 */
export async function expandGroupCalculation(group: ItemGroupEntity) {
  let groupFormulaAttributes: FormulaTotalsAttribute = {
    [AttributeName.PRICE_MATERIAL]: 0,
    [AttributeName.PRICE_EFFORD]: 0,
    [AttributeName.PRICE_MANUFACTURING]: 0,
    [AttributeName.PRICE_ASSEMBLY]: 0,
    [AttributeName.PRICE_TOTAL]: 0
  };
  const groupFormulas = group.getAttribute(AttributeName.FORMULAS) as  FormulaAttribute[] ?? [];

  for(const item of group.items) {
    const itemChanges = item.getAttribute(AttributeName.TOTAL_FORMULA_CHANGE) as FormulaTotalsAttribute;
    groupFormulaAttributes[AttributeName.PRICE_MATERIAL] += itemChanges?.[AttributeName.PRICE_MATERIAL] ?? 0;
    groupFormulaAttributes[AttributeName.PRICE_EFFORD] += itemChanges?.[AttributeName.PRICE_EFFORD] ?? 0;
    groupFormulaAttributes[AttributeName.PRICE_MANUFACTURING] += itemChanges?.[AttributeName.PRICE_MANUFACTURING] ?? 0;
    groupFormulaAttributes[AttributeName.PRICE_ASSEMBLY] += itemChanges?.[AttributeName.PRICE_ASSEMBLY] ?? 0;
    groupFormulaAttributes[AttributeName.PRICE_TOTAL] += itemChanges?.[AttributeName.PRICE_TOTAL] ?? 0;

    const itemFormulas = item.getAttribute(AttributeName.FORMULAS) as  FormulaAttribute[] ?? [];
    for(const itemFormula of itemFormulas) {
      const findFormula = groupFormulas.find(f => f.id === itemFormula.id);
      if(!findFormula) {
        groupFormulas.push(cloneDeep(itemFormula));
      }
      else {
        findFormula.changes[AttributeName.PRICE_MATERIAL].value += itemFormula.changes[AttributeName.PRICE_MATERIAL].value;
        findFormula.changes[AttributeName.PRICE_MANUFACTURING].value += itemFormula.changes[AttributeName.PRICE_MANUFACTURING].value;
        findFormula.changes[AttributeName.PRICE_ASSEMBLY].value += itemFormula.changes[AttributeName.PRICE_ASSEMBLY].value;
        findFormula.changes[AttributeName.PRICE_EFFORD].value += itemFormula.changes[AttributeName.PRICE_EFFORD].value;
      }
    }
  }
  group.setAttribute(AttributeName.TOTAL_FORMULA_CHANGE, groupFormulaAttributes);
  group.setAttribute(AttributeName.FORMULAS, groupFormulas);
}

 
/**
 * This function expands the calculation of an item by applying the settings and formulas.
 * It calculates the price for effort, manufacturing, assembly, and total based on the settings and item attributes.
 * It also updates the formula changes for material, manufacturing, assembly, and effort.
 *
 * @param item - The item for which the calculation needs to be expanded.
 * @param store - The Ngrx store to retrieve the applied settings.
 *
 * @returns {Promise<void>} - The function returns a promise that resolves when the calculation is complete.
 */
export async function expandItemCalculation(item: ItemEntity, store: Store): Promise<void> {
  const settings = await firstValueFrom(store.select(SettingsSelectors.selectApplied));
  const priceSplit = settings.calculation.seperateManufacturingAssembly;
  if(settings) {
    const effordHours = item.getAttribute(AttributeName.EFFORD_HOURS);
    const hourlyMixedPrice = settings.calculation.hourlyMixedPrice
    
    if (typeof effordHours === 'number') {
      if (priceSplit) {
        const prices = splitPrices(effordHours, settings);
        item.setAttribute(AttributeName.PRICE_MANUFACTURING, prices.manufacturingPrice);
        item.setAttribute(AttributeName.PRICE_ASSEMBLY, prices.assemblyPrice);
        item.setAttribute(AttributeName.PRICE_EFFORD, prices.manufacturingPrice + prices.assemblyPrice);
      } else {
        const price = effordHours * hourlyMixedPrice;
        item.setAttribute(AttributeName.PRICE_EFFORD, price);
      }
    }
    item.setAttribute(AttributeName.PRICE_TOTAL, (item.getAttribute(AttributeName.PRICE_MATERIAL) as number) + (item.getAttribute(AttributeName.PRICE_EFFORD) as number));
  
  
    const formulas = item.getAttribute(AttributeName.FORMULAS) as FormulaAttribute[] ?? [];
    if(formulas) {
      for (const formula of formulas) {
        if(priceSplit) {
          const splitChangesBefore = splitPrices(formula.changes[AttributeName.EFFORD_HOURS].before, settings)
          const splitChangesAfter = splitPrices(formula.changes[AttributeName.EFFORD_HOURS].after, settings)
          formula.changes[AttributeName.PRICE_MANUFACTURING].value = splitChangesAfter.manufacturingPrice - splitChangesBefore.manufacturingPrice;
          formula.changes[AttributeName.PRICE_ASSEMBLY].value = splitChangesAfter.assemblyPrice - splitChangesBefore.assemblyPrice;
          formula.changes[AttributeName.PRICE_EFFORD].value = (splitChangesAfter.manufacturingPrice + splitChangesAfter.assemblyPrice) - (splitChangesBefore.manufacturingPrice + splitChangesBefore.assemblyPrice);
        } else {
          formula.changes[AttributeName.PRICE_EFFORD].value = (hourlyMixedPrice * formula.changes[AttributeName.EFFORD_HOURS].value);
        }
      }
      setFormulaChangesOfItem(item, formulas, priceSplit);
    }
  }
}

/**
 * This function calculates the manufacturing and assembly prices based on the given effort hours and settings.
 *
 * @param effordHours - The number of hours for which the prices need to be calculated.
 * @param settings - The application settings containing the manufacturing and assembly split amount, and hourly prices.
 *
 * @returns {SplitResults} - An object containing the calculated manufacturing and assembly prices.
 *
 * @remarks
 * The function calculates the manufacturing and assembly prices based on the given effort hours and settings.
 * The manufacturing price is calculated as the product of the effort hours, the manufacturing split amount percentage,
 * and the hourly manufacturing price.
 * The assembly price is calculated as the product of the effort hours, the remaining percentage (1 - manufacturing split amount percentage),
 * and the hourly assembly price.
 * The function returns an object containing the calculated manufacturing and assembly prices.
 */
function splitPrices(effordHours: number, settings: Settings): SplitResults {

  const splitAmountPercentage = settings.calculation.manufacturingSplitAmount / 100;
  const manufacturingPrice = effordHours * splitAmountPercentage * settings.calculation.hourlyManufacturingPrice;
  const assemblyPrice = effordHours * (1 - splitAmountPercentage) * settings.calculation.hourlyAssemblyPrice;

  return { 
    manufacturingPrice,
    assemblyPrice
  };
}

// Gilt für einzlne Spalten. Also seperat für Material, Fertigung & Montage (zusammen) oder in Fertigung, Montage
/**
 * This function calculates and updates the total formula changes for an item based on the given formulas and settings.
 * It iterates through the formulas, calculates the price changes for each attribute (material, manufacturing, assembly, effort),
 * and updates the item's total formula changes accordingly.
 *
 * @param item - The item for which the formula changes need to be calculated and updated.
 * @param formulas - The formulas associated with the item.
 * @param priceSplit - A boolean indicating whether the manufacturing and assembly prices should be split.
 * @param parent - An optional parameter representing the parent item group.
 *
 * @returns {void} - The function does not return any value.
 *
 * @remarks
 * The function calculates the total formula changes for each attribute (material, manufacturing, assembly, effort)
 * and updates the item's total formula changes accordingly.
 * If the `priceSplit` parameter is true, the function calculates the manufacturing and assembly price changes separately.
 * If the `priceSplit` parameter is false, the function calculates the effort price changes only.
 * The function also updates the `totalChanges` property of each formula with the sum of the attribute changes.
 */
function setFormulaChangesOfItem(item: ItemEntity, formulas: FormulaAttribute[], priceSplit: boolean, parent?: ItemGroupEntity) {
  let itemFomulaAttributes: FormulaTotalsAttribute = {
    [AttributeName.PRICE_MATERIAL]: 0,
    [AttributeName.PRICE_EFFORD]: 0,
    [AttributeName.PRICE_MANUFACTURING]: 0,
    [AttributeName.PRICE_ASSEMBLY]: 0,
    [AttributeName.PRICE_TOTAL]: 0
  };

  for(const formula of formulas) {
    const materialAddition = priceChangesAddition(formula, AttributeName.PRICE_MATERIAL);
    itemFomulaAttributes[AttributeName.PRICE_MATERIAL] += materialAddition;
    if(priceSplit) {
      const manufacturingAddition = priceChangesAddition(formula, AttributeName.PRICE_MANUFACTURING);
      const assemblyAddition = priceChangesAddition(formula, AttributeName.PRICE_ASSEMBLY);
      itemFomulaAttributes[AttributeName.PRICE_MANUFACTURING] += manufacturingAddition;
      itemFomulaAttributes[AttributeName.PRICE_ASSEMBLY] += assemblyAddition;
      formula.totalChanges =  materialAddition + manufacturingAddition + assemblyAddition;
      itemFomulaAttributes[AttributeName.PRICE_TOTAL] += formula.totalChanges;
    } else {
      const effordAddition = priceChangesAddition(formula, AttributeName.PRICE_EFFORD);
      itemFomulaAttributes[AttributeName.PRICE_EFFORD] += effordAddition;
      formula.totalChanges = materialAddition + effordAddition;
      itemFomulaAttributes[AttributeName.PRICE_TOTAL] += formula.totalChanges;
    }
  }
  item.setAttribute(AttributeName.TOTAL_FORMULA_CHANGE, itemFomulaAttributes);
}

// Ausschließlich zur Berechnung
/**
 * Calculates the total price change for a specific attribute within a formula.
 *
 * @param formula - The formula object containing the attribute changes.
 * @param changesField - The attribute for which the price change needs to be calculated.
 *
 * @returns {number} - The total price change for the specified attribute.
 *
 * @remarks
 * This function checks if the formula has changes for the specified attribute and returns the change value.
 * If the formula or the attribute changes are not present, it returns 0.
 */
function priceChangesAddition(formula: FormulaAttribute, changesField: keyof ChangesEntity): number {
  if(formula.changes && formula.changes[changesField]?.value) {
    return formula.changes?.[changesField].value as number;
  }
  return 0;
}