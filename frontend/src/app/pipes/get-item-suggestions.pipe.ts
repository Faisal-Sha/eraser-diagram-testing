import { Pipe, PipeTransform } from "@angular/core";
import { ItemCategory, ItemEntity } from "@common/entities/item/item.entity";
import { SuggestionService } from "../services/suggestion/suggestion.service";
import { I18NextPipe } from "angular-i18next";
import { instanciateItem } from "@common/entities/item/resolvers/item.resolver";
import { OptionGroup, OptionItem } from "../interfaces/option.interface";

@Pipe({
  name: 'getItemSuggestions',
  standalone: true,
  pure: true
})
export class GetItemSuggestionsPipe implements PipeTransform {
  /**
   * Construct a new instance of the GetItemSuggestionsPipe.
   * @param suggestionService The service that provides the suggestions.
   * @param i18NextPipe The pipe that translates the suggestion labels.
   */
  constructor(
    private suggestionService: SuggestionService,
    private i18NextPipe: I18NextPipe
  ) { }

  /**
   * Retrieves and groups suggestions for a specific field of an item.
   *
   * @param item - The item for which suggestions are to be retrieved.
   * @param fieldName - The name of the field for which suggestions are to be retrieved.
   * @param includeCustom - A flag indicating whether to include custom suggestions.
   * @returns A promise that resolves to an array of grouped options.
   */
  private async getOptions(item: ItemEntity, fieldName: string, includeCustom?: boolean): Promise<OptionGroup[]> {
    const instanciatedItem = instanciateItem(item);
    const options = await this.suggestionService.getColumnSuggestions(instanciatedItem, fieldName, includeCustom);

    const groupedOptions = options.reduce(
      (acc: OptionGroup[], value: OptionItem) => {
        const group = acc.find((a: OptionItem) => a.value === value.group);
        if (!group) {
          acc.push({
            label: this.i18NextPipe.transform(`pipefittings.group.${fieldName}.${value.group ?? 'Default'}`),
            value: value.group,
            items: [value],
          } as OptionGroup);
          return acc;
        }
        group.items.push(value);
        return acc;
      },
      []
    );
    return groupedOptions;
  }

  /**
   * Retrieves and groups suggestions for a specific field of an item.
   *
   * @param item - The item for which suggestions are to be retrieved.
   * @param fieldName - The name of the field for which suggestions are to be retrieved.
   * @param includeCustom - A flag indicating whether to include custom suggestions.
   * @returns A promise that resolves to an array of grouped options.
   */
  async getSuggestions(item: ItemEntity, fieldName: string, includeCustom: boolean): Promise<OptionGroup[]> {
    return this.getOptions(item, fieldName, includeCustom);
  }

  /**
   * Transforms an item or typeId into suggestions for a specific field of an item.
   *
   * @param itemOrTypeId - The item entity or typeId for which suggestions are to be retrieved.
   * If a string is provided, it will be used to create a new item entity with the specified typeId and category.
   * @param fieldName - The name of the field for which suggestions are to be retrieved.
   * @param includeCustom - A flag indicating whether to include custom suggestions.
   * The default value is `true`.
   *
   * @returns A promise that resolves to an array of grouped options.
   * Each group contains a label, a value, and an array of items.
   * The items represent the suggestions for the specified field.
   */
  async transform(itemOrTypeId: ItemEntity | string, fieldName: string, includeCustom = true): Promise<OptionGroup[]> {
    if (!itemOrTypeId && typeof itemOrTypeId !== "string") {
      return [];
    }
    if (typeof itemOrTypeId === "string") {
      itemOrTypeId = instanciateItem({ typeId: itemOrTypeId, category: ItemCategory.PIPEFITTING } as ItemEntity);
    }
    return this.getSuggestions(itemOrTypeId, fieldName, includeCustom);
  }
}
