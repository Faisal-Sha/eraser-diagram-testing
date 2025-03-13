
import { DIAMETER_NOMINAL_LABELS } from '@common/constants/diameter-nominal.const';
import { MATERIAL_TYPE, getMaterialType } from '../../../constants/material';
import { PIPE_FITTING_GROUPS, PIPE_FITTING_IDS_WITH_FORMULA, SUPPORTED_PIPE_FITTINGS } from '../../../constants/pipe-fittings.const';
import { isRuleCustom } from 'src/services/pipe-fitting/pipe-fitting.service';
import { SuggestionServiceContainer } from 'src/interfaces/suggestion-service-container.interface';
import { Option } from '@common/interfaces/suggestion.interface';
import { safeEquals } from '@common/utils/operations.util';
import { I18nContext } from 'nestjs-i18n';
import { CUSTOM_RULE_DN, CUSTOM_RULE_SUGGESTIONS } from 'src/constants/suggestion.const';
import { ItemPipeFittingEntity } from '@common/entities/item/items/pipe-fitting.entity';

const LABEL_MAPPING = {
  "dn1": (v) => DIAMETER_NOMINAL_LABELS[v] ?? v,
  "dn2": (v) => DIAMETER_NOMINAL_LABELS[v] ?? v,
};

/**
 * Sorts an array of suggestion objects based on their numeric values.
 *
 * @param suggestions - An array of suggestion objects with `label`, `value`, and optional `group` properties.
 *
 * @returns A new array of suggestion objects sorted by their numeric values in ascending order.
 *
 * @example
 * const unsortedSuggestions = [
 *   { label: 'Small', value: 10 },
 *   { label: 'Large', value: 50 },
 *   { label: 'Medium', value: 30 }
 * ];
 *
 * const sortedSuggestions = sortNumberSuggestions(unsortedSuggestions);
 * console.log(sortedSuggestions);
 * // Output: [
 * //   { label: 'Small', value: 10 },
 * //   { label: 'Medium', value: 30 },
 * //   { label: 'Large', value: 50 }
 * // ]
 */
function sortNumberSuggestions(suggestions: { label: string; value: number; group?: string; }[]): { label: string; value: number; group?: string; }[] {
  return suggestions.sort((a, b) => {
    if (a.value < b.value) {
      return -1;
    }
    if (a.value > b.value) {
      return 1;
    }
    return 0;
  });
}

const POST_PROCESSING = {
  "typeId": (serviceContainer: SuggestionServiceContainer, suggestions: { label: string, value: string }[], item: ItemPipeFittingEntity) => suggestions.map((suggestion) => {
    return {
      ...suggestion,
      group: Object.keys(PIPE_FITTING_GROUPS).find(key => PIPE_FITTING_GROUPS[key].includes(suggestion.value)) ?? 'other'
    };
  }).sort((a, b) => {
    // sort by sort order of values in PIPE_FITTING_GROUPS
    const aGroup = Object.keys(PIPE_FITTING_GROUPS).find(key => PIPE_FITTING_GROUPS[key].includes(a.value));
    const bGroup = Object.keys(PIPE_FITTING_GROUPS).find(key => PIPE_FITTING_GROUPS[key].includes(b.value));
    if (aGroup && bGroup) {
      return PIPE_FITTING_GROUPS[aGroup].indexOf(a.value) - PIPE_FITTING_GROUPS[bGroup].indexOf(b.value);
    }
    return 0;
  }),
  "dn1": (serviceContainer: SuggestionServiceContainer, suggestions: { label: string, value: number, group?: string; }[], item: ItemPipeFittingEntity) => sortNumberSuggestions(suggestions).map((suggestion) => {
      return {
          label: suggestion.label,
          value: suggestion.value,
          group: suggestion.group
      };
  }).sort((a, b) => {
    if (!a.group && !b.group) {
      return 0;
    }
    if (a.group === "free" && b.group !== "free") {
      return -1;
    }
    if (a.group !== "free" && b.group === "free") {
      return 1;
    }
    return 0;
  }),
  "dn2": (serviceContainer: SuggestionServiceContainer, suggestions: { label: string, value: number }[], item: ItemPipeFittingEntity) => sortNumberSuggestions(suggestions).map((suggestion) => {
    return {
      label: suggestion.label,
      value: suggestion.value,
      group: suggestion.group
    };
  }).sort((a, b) => {
    if (!a.group && !b.group) {
      return 0;
    }
    if (a.group === "free" && b.group !== "free") {
      return -1;
    }
    if (a.group !== "free" && b.group === "free") {
      return 1;
    }
    return 0;
  }),
  "s1": (serviceContainer: SuggestionServiceContainer, suggestions: { label: string, value: number }[], item: ItemPipeFittingEntity) => {
    suggestions = sortNumberSuggestions(suggestions);

    let result = suggestions.map((suggestion) => ({
      label: suggestion.label.replace(".", ","),
      value: suggestion.value
    }));

    if (!item.dn1 || !item.material) {
      return result;
    }

    const matchingOption = CUSTOM_RULE_DN.find(dn => safeEquals(dn.value, item.dn1));
    const matchingRange = matchingOption?.sRange?.find(sr => sr.pipeFittings.includes(item.typeId))?.[getMaterialType(item.material)];

    if (matchingRange) {
      result = result.filter(s => (safeEquals(s.value, matchingRange.min) || safeEquals(s.value, matchingRange.max)) || (s.value >= matchingRange.min && s.value <= matchingRange.max))
    }
    return result;
  },
  "s2": (serviceContainer: SuggestionServiceContainer, suggestions: { label: string, value: number }[], item: ItemPipeFittingEntity) => {
    suggestions = sortNumberSuggestions(suggestions);

    let result = suggestions.map((suggestion) => ({
      label: suggestion.label.replace(".", ","),
      value: suggestion.value
    }));

    if (!item.dn2 || !item.material) {
      return result;
    }

    const matchingOption = CUSTOM_RULE_DN.find(dn => safeEquals(dn.value, item.dn2));
    const matchingRange = matchingOption?.sRange?.find(sr => sr.pipeFittings.includes(item.typeId))?.[getMaterialType(item.material)];

    if (matchingRange) {
      result = result.filter(s => (safeEquals(s.value, matchingRange.min) || safeEquals(s.value, matchingRange.max)) || (s.value >= matchingRange.min && s.value <= matchingRange.max))
    }
    return result;
  },
  "material": (serviceContainer: SuggestionServiceContainer, suggestions: { label: string, value: string }[], item: ItemPipeFittingEntity) => {
    const result = [];
    const types = [... new Set(suggestions.map((e) => getMaterialType(e.value)))];
    types.forEach((type) => {
      let materials = Object.keys(MATERIAL_TYPE).filter((key) => MATERIAL_TYPE[key] === type).map((key) => ({
        label: key,
        value: key,
        group: type
      }));

      if (type === "S") {
        materials = materials.sort((a, b) => {
          if (a.value < b.value) {
            return 1;
          }
          if (a.value > b.value) {
            return -1;
          }
          return 0;
        });
      }
      result.push(...materials);
    });

    return result;
  }
};

/**
 * Retrieves a list of options for a specific column based on the provided item and column name.
 * The function handles different scenarios, such as custom rules, available pipe fitting IDs, and column availability.
 *
 * @param serviceContainer - An instance of the SuggestionServiceContainer, providing access to necessary services.
 * @param item - The item for which the options are being retrieved.
 * @param column - The name of the column for which the options are required.
 *
 * @returns An array of Option objects, containing the label and value for each option.
 *
 * @example
 * const options = getColumnOptions(serviceContainer, item, 'material');
 * console.log(options);
 * // Output: [
 * //   { label: 'Steel', value: 'S' },
 * //   { label: 'Copper', value: 'C' },
 * //   { label: 'Plastic', value: 'P' }
 * // ]
 */
export function getColumnOptions(
  serviceContainer: SuggestionServiceContainer,
  item: ItemPipeFittingEntity,
  column: string
): (Option<number> | Option<string>)[] {
  if (column === 'typeId') {
    return POST_PROCESSING.typeId(serviceContainer,
      [...PIPE_FITTING_IDS_WITH_FORMULA, ...serviceContainer.pipeFittingService.getAvailablePipeFittingIDs()].filter(typeId => SUPPORTED_PIPE_FITTINGS.includes(typeId)).map((typeId) => ({
        label: serviceContainer.i18nService.t(`pipedata.pipeFitting.${typeId}`, { lang: I18nContext.current().lang }),
        value: typeId
      })), item
    );
  }

  if (!item.typeId) {
    const pipeFittings = serviceContainer.pipeFittingService.findPipeFittings(item, column);
    const matchingValues = [...new Set([...pipeFittings.map((entity) => entity[column])])];
    const options = matchingValues.map((value) => ({
      label: LABEL_MAPPING[column] ? LABEL_MAPPING[column](value) : value.toString(),
      value
    })) as (Option<number> | Option<string>)[];

    if (POST_PROCESSING[column]) {
      return POST_PROCESSING[column](serviceContainer, options, item);
    }
    return options;
  }
  
  if (!item.isColumnAvailable(column)) {
    return [];
  }

  /* Detect calculation rules like for welded pipe which is calculated by formula instead of csv search */
  const ruleset = serviceContainer.pipeFittingService.getRuleset(item);

  if (isRuleCustom(ruleset)) {
    const options = CUSTOM_RULE_SUGGESTIONS[column] ?? [];
    if (POST_PROCESSING[column]) {
      return POST_PROCESSING[column](serviceContainer, options, item);
    }
    return options;
  }

  const pipeFittings = serviceContainer.pipeFittingService.findPipeFittings(item, column);
  const matchingValues = [...new Set([...pipeFittings.map((entity) => entity[column])])];
  const options = matchingValues.map((value) => ({
    label: LABEL_MAPPING[column] ? LABEL_MAPPING[column](value) : value.toString(),
    value
  })) as (Option<number> | Option<string>)[];

  if (POST_PROCESSING[column]) {
    return POST_PROCESSING[column](serviceContainer, options, item);
  }
  return options;
}

/*export function getNextColumn(
  serviceContainer: SuggestionServiceContainer,
  item: ItemPipeFittingEntity,
  field: string
): string | null {
  return null;
}*/