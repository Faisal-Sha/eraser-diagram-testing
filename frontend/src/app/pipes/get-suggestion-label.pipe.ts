import { Pipe, PipeTransform } from "@angular/core";
import { OptionGroup, OptionItem } from "../interfaces/option.interface";

@Pipe({
  name: 'getSuggestionLabel',
  standalone: true,
  pure: true
})
export class GetSuggestionLabelPipe implements PipeTransform {
  constructor() { }

  /**
   * A pipe that retrieves the label of a suggestion based on its value.
   * The suggestions can be either grouped or ungrouped.
   *
   * @param suggestions - An array of OptionGroup or OptionItem objects representing the suggestions.
   * @param value - The value of the suggestion to retrieve the label for.
   *
   * @returns The label of the suggestion if found, or the original value if not found.
   */
  transform(suggestions: OptionGroup[] | OptionItem[], value: string | number) {
    if (!suggestions) {
      return null;
    }

    const isGrouped = (suggestions as OptionGroup[]).every((suggestion: OptionGroup) => suggestion.items);
    
    if (isGrouped) {
      const item = (suggestions as OptionGroup[]).reduce((acc: OptionItem | null, group: OptionGroup) => {
        if (acc) {
          return acc;
        }

        return group.items.find((item: OptionItem) => item.value === value) || null;
      }, null);

      if (!item) {
        return value;
      }

      return item.label;
    }

    const item = (suggestions as OptionItem[]).find((item: OptionItem) => item.value === value);
    if (!item) {
      return value;
    }

    return item.label;
  }
}
