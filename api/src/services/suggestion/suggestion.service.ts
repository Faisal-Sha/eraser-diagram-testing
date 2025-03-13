import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PipeFittingService } from '../pipe-fitting/pipe-fitting.service';
import { Option } from '@common/interfaces/suggestion.interface';
import { SuggestionServiceContainer } from '../../interfaces/suggestion-service-container.interface';
import { ItemCategory, ItemEntity } from '@common/entities/item/item.entity';

import { getColumnOptions as getPipeFittingColumnOptions } from './resolver/pipefitting.resolver';
import { ItemPipeFittingEntity } from '@common/entities/item/items/pipe-fitting.entity';

@Injectable()
export class SuggestionService {

  readonly serviceContainer: SuggestionServiceContainer;

  /**
   * Initialize the service with the pipe fitting service and the i18n service.
   * The service container is created with references to the injected services.
   * @param pipeFittingService The pipe fitting service.
   * @param i18nService The i18n service.
   */
  constructor(
    private pipeFittingService: PipeFittingService,
    private i18nService: I18nService
  ) {
    this.serviceContainer = {
      pipeFittingService: this.pipeFittingService,
      i18nService: this.i18nService
    };
  }

  /**
   * Retrieves column options for a specific item and field.
   *
   * @param item - The item for which column options are to be retrieved.
   * @param field - The field for which column options are to be retrieved.
   *
   * @returns An array of options, where each option is either a number or a string.
   *
   * @throws Will throw an error if no suggestion resolver is found for the item's category.
   *
   * @example
   * ```typescript
   * const item = new ItemPipeFittingEntity();
   * const field = 'diameter';
   * const options = suggestionService.getColumnOptions(item, field);
   * console.log(options); // Output: [{ value: 10, label: '10' }, { value: 12, label: '12' }, ...]
   * ```
   */
  public getColumnOptions(item: ItemEntity, field: string): (Option<number> | Option<string>)[] {
    if (item instanceof ItemPipeFittingEntity) {
      return getPipeFittingColumnOptions(this.serviceContainer, item as any, field);
    }
    throw new Error(`No suggestion resolver for category ${item.category}`);
  }

  /*public getNextField(item: ItemEntity, field: string): string | null {
    if (item instanceof ItemPipeFittingEntity) {
        return getPipeFittingNextColumn(this.serviceContainer, item, field);
    }

    throw new Error(`No suggestion resolver for category ${item.category}`);
  }*/
}
