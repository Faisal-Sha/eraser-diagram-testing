import { Body, Controller, Post } from '@nestjs/common';
import { SuggestionRequest, SuggestionResult } from '@common/interfaces/suggestion.interface';
import { SuggestionService } from '../../services/suggestion/suggestion.service';
import { instanciateItem } from '@common/entities/item/resolvers/item.resolver';
import { castArray } from 'lodash';

@Controller('api/suggestion')
export class SuggestionController {

  /**
   * Creates an instance of the SuggestionController.
   *
   * @param {SuggestionService} suggestionService - The suggestion service, used to get column suggestions.
   */
  constructor(
    private suggestionService: SuggestionService
  ) { }

  /**
   * Handles POST requests to the '/api/suggestion' endpoint.
   * Processes suggestion requests and returns column suggestions based on the input data.
   *
   * @param {SuggestionRequest | SuggestionRequest[]} suggestionRequest - The suggestion request object or an array of suggestion request objects.
   * @returns {SuggestionResult[]} - An array of suggestion results, each containing the id, column, and suggestions for the corresponding input.
   */
  @Post()
  suggestions(@Body() suggestionRequest: SuggestionRequest | SuggestionRequest[]) {
    const result: SuggestionResult[] = [];

    const suggestions = castArray(suggestionRequest);
    for (const suggestion of suggestions) {
      try {
        const item = instanciateItem(suggestion.item);
        result.push({
          id: suggestion.id,
          column: suggestion.column,
          suggestions: this.suggestionService.getColumnOptions(item, suggestion.column)
        });
      } catch (e) {
        console.error(e);
        result.push({
          id: suggestion.id,
          column: suggestion.column,
          suggestions: []
        });
      }
    };
    return result;
  }
}
 