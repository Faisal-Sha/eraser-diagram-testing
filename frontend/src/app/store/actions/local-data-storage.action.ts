import { createAction, props } from '@ngrx/store';
import { LocalDataStorage } from '../states/local-data-storage.state';
import { PartialDeep } from 'type-fest';

/**
 * Action to load local data storage.
 */
export const load = createAction('[LocalDataStorage] Load');

/**
 * Action to load local data storage.
 */
export const loadFromData = createAction('[LocalDataStorage] Load from data', props<{ data: PartialDeep<LocalDataStorage> }>());

/**
 * Action dispatched when loading local data storage is successful.
 * @param localDataStorage The loaded local data storage.
 */
export const loadSuccess = createAction('[LocalDataStorage] Load success ', props<{ localDataStorage: PartialDeep<LocalDataStorage> }>());

/**
 * Action dispatched when loading local data storage fails.
 * @param error The error that occurred during loading.
 */
export const loadFailure = createAction('[LocalDataStorage] Load Failed', props<{ error: Error }>());

/**
 * Action to save local data storage.
 * @param localDataStorage The local data storage to be saved.
 */
export const save = createAction('[LocalDataStorage] Save', props<{ localDataStorage: LocalDataStorage, skipDispatch?: boolean }>());

/**
 * Action dispatched when saving local data storage is successful.
 * @param localDataStorage The saved local data storage.
 */
export const saveSuccess = createAction('[LocalDataStorage] Save Success', props<{ localDataStorage: LocalDataStorage }>());

/**
 * Action dispatched when saving local data storage fails.
 * @param error The error that occurred during saving.
 */
export const saveFailure = createAction('[LocalDataStorage] Save Failed', props<{ error: Error }>());

