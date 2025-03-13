import { ItemEntity } from '@common/entities/item/item.entity';

/**
 * Interface for a suggestion option.
 */
export interface Option<T> {
  label: string;
  value: T;
  group?: string;
}

/**
 * Interface for a suggestion result.
 */
export interface SuggestionResult<T = any> {
  id: string;
  column: string;
  suggestions: (Option<T>)[];
}

/**
 * Interface for a suggestion request.
 */
export interface SuggestionRequest {
  id: string;
  item: ItemEntity;
  column: string;
}
