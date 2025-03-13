import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SuggestionRequest, SuggestionResult } from '@common/interfaces/suggestion.interface';
import { environment } from '../../../environments/environment';
import { I18NEXT_SERVICE, I18NextService } from 'angular-i18next';
import { ItemEntity } from '@common/entities/item/item.entity';
import { CustomItemService } from '../custom-item/custom-item.service';
import { safeEquals } from '@common/utils/operations.util';
import { CollectorServiceAbstract } from '../collector/collector.abstract';

export type SuggestionList = SuggestionResult['suggestions'];

interface RequestItem {
  id: string;
  item: ItemEntity;
  column: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuggestionService extends CollectorServiceAbstract<RequestItem, SuggestionResult, SuggestionRequest[], SuggestionResult[]> {
  protected override ENDPOINT = environment.apiUrl + '/suggestion';


  /**
   * Initialize the service with the injected services.
   * @param httpClient The Angular HttpClient used to make requests
   * @param i18nService The i18next service used for translation
   * @param customItemService The custom item service used to get custom suggestions
   */
  constructor(
    httpClient: HttpClient,
    @Inject(I18NEXT_SERVICE) i18nService: I18NextService,
    private customItemService: CustomItemService
  ) {
    super(httpClient, i18nService);
  }
  
  /**
   * Retrieves suggestions for a specific column of an item.
   *
   * @param item - The item for which suggestions are requested.
   * @param column - The column for which suggestions are requested.
   * @param appendCustom - If true, custom suggestions will be appended to the default suggestions.
   *
   * @returns A Promise that resolves to an array of suggestion objects.
   *
   * @remarks
   * This function sends a request to the server to retrieve suggestions for the given item and column.
   * If `appendCustom` is true, it also fetches custom suggestions and appends them to the default suggestions.
   * If the item is custom and the column is not 'typeId', no suggestions are fetched from the server.
   *
   * @example
   * ```typescript
   * const item = new ItemEntity({ id: '123', name: 'Example Item' });
   * const suggestions = await suggestionService.getColumnSuggestions(item, 'materialId', true);
   * console.log(suggestions);
   * ```
   */
  public async getColumnSuggestions(item: ItemEntity, column: string, appendCustom: boolean = false): Promise<SuggestionList> {
    const suggestionResponse = (item.isCustom() && column !== 'typeId') ? null : await this.sendQueuedRequest({
      id: item.getCalculationHash(column),
      item,
      column
    });

    const suggestions = suggestionResponse === null ? [] : suggestionResponse.suggestions;
    if (appendCustom) {
      let customSuggestions = await this.customItemService.getCustomSuggestions(item, column);

      if (customSuggestions.length === 0) {
        return suggestions;
      }

      customSuggestions = customSuggestions.filter(suggestion => !suggestions.some(s => safeEquals(s.value, suggestion.value)))

      const isGrouped = suggestions.some(suggestion => suggestion.group);
      if (!isGrouped) {
        return suggestions.map(suggestion => {
          return {
            ...suggestion,
            group: 'Default'
          };
        }).concat(customSuggestions.map(suggestion => {
          return {
            ...suggestion,
            group: 'Custom'
          };
        }));
      }
      return suggestions.concat(customSuggestions.map(suggestion => {
        return {
          ...suggestion,
          group: 'Custom'
        };
      }));
    }
    return suggestions;
  }

  /**
   * Generates a request body for fetching suggestions based on the given items.
   *
   * @param items - An array of request items containing the item, column, and unique identifier.
   *
   * @returns An array of suggestion requests, each containing the item's unique identifier, column, and the item itself.
   *
   * @remarks
   * This function maps each item in the input array to a suggestion request object,
   * which includes the item's unique identifier, column, and the item itself.
   * This request body is then sent to the server for fetching suggestions.
   *
   * @example
   * ```typescript
   * const items: RequestItem[] = [
   *   { id: '123', item: new ItemEntity({ id: '123', name: 'Example Item' }), column: 'materialId' },
   *   { id: '456', item: new ItemEntity({ id: '456', name: 'Another Item' }), column: 'categoryId' }
   * ];
   * const requestBody = suggestionService.generateRequestBody(items);
   * console.log(requestBody);
   * ```
   */
  protected override generateRequestBody(items: RequestItem[]): SuggestionRequest[] {
    return items.map(item => ({
      id: item.id,
      column: item.column,
      item: item.item
    }));
  }

  /**
   * Parses the response from the server and returns an array of suggestion results.
   *
   * @param response - The response from the server, which is an array of suggestion results.
   *
   * @returns An array of suggestion results.
   *
   * @remarks
   * This function is responsible for parsing the response from the server and returning an array of suggestion results.
   * In this case, the function simply returns the input response as it is, as the response is already an array of suggestion results.
   *
   * @example
   * ```typescript
   * const serverResponse: SuggestionResult<any>[] = [
   *   { id: '123', suggestions: [{ value: 'Material A', label: 'Material A' }, { value: 'Material B', label: 'Material B' }] },
   *   { id: '456', suggestions: [{ value: 'Category 1', label: 'Category 1' }, { value: 'Category 2', label: 'Category 2' }] }
   * ];
   * const parsedResponse = suggestionService.parseItemsFromResponse(serverResponse);
   * console.log(parsedResponse); // Output: [ { id: '123', suggestions: [ ... ] }, { id: '456', suggestions: [ ... ] } ]
   * ```
   */
  protected override parseItemsFromResponse(response: SuggestionResult<any>[]): SuggestionResult<any>[] {
    return response;
  }

  /**
   * Checks if a request item matches a response item based on their unique identifiers.
   *
   * @param requestItem - The request item to be matched.
   * @param responseItem - The response item to be matched.
   *
   * @returns A boolean indicating whether the request item matches the response item.
   *
   * @remarks
   * This function compares the unique identifier of the request item with the unique identifier of the response item.
   * If they match, it returns `true`; otherwise, it returns `false`.
   *
   * @example
   * ```typescript
   * const requestItem: RequestItem = { id: '123', item: new ItemEntity({ id: '123', name: 'Example Item' }), column: 'materialId' };
   * const responseItem: SuggestionResult = { id: '123', suggestions: [{ value: 'Material A', label: 'Material A' }] };
   * const isMatch = suggestionService.matchItems(requestItem, responseItem);
   * console.log(isMatch); // Output: true
   * ```
   */
  protected override matchItems(requestItem: RequestItem, responseItem: SuggestionResult): boolean {
    return requestItem.id === responseItem.id;
  }

  /**
   * Generates a unique hash for a request item based on the item's properties and the specified column.
   *
   * @param item - The request item for which the hash needs to be generated.
   * @returns A string representing the unique hash for the given item and column.
   *
   * @remarks
   * This function uses the `getCalculationHash` method of the `ItemEntity` class to generate a unique hash.
   * The hash is generated based on the item's properties and the specified column, excluding the 'quantity' property.
   * This ensures that the hash is unique for different combinations of item properties and columns.
   *
   * @example
   * ```typescript
   * const requestItem: RequestItem = { id: '123', item: new ItemEntity({ id: '123', name: 'Example Item', quantity: 10 }), column: 'materialId' };
   * const hash = suggestionService.generateItemHash(requestItem);
   * console.log(hash); // Output: '123-materialId'
   * ```
   */
  protected override generateItemHash(item: RequestItem): string {
    return item.item.getCalculationHash(item.column, ['quantity']);
  }

  /**
   * Checks if a response item is cachable based on the number of suggestions.
   *
   * @param responseItem - The response item to be checked for cachability.
   * @returns A boolean indicating whether the response item is cachable.
   *
   * @remarks
   * This function checks if the response item contains any suggestions.
   * If the number of suggestions is greater than 0, the response item is considered cachable and `true` is returned.
   * Otherwise, `false` is returned.
   *
   * @example
   * ```typescript
   * const responseItem: SuggestionResult = { id: '123', suggestions: [{ value: 'Material A', label: 'Material A' }] };
   * const isCachable = suggestionService.isCachable(responseItem);
   * console.log(isCachable); // Output: true
   * ```
   */
  protected override isCachable(responseItem: SuggestionResult): boolean {
    return responseItem.suggestions.length > 0;
  }
}
