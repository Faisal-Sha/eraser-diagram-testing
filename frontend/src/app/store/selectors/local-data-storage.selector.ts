import { createFeatureSelector, createSelector } from "@ngrx/store";
import { LocalDataStorageState } from "../states/local-data-storage.state";

/**
 * Selects the local data storage state from the store.
 */
export const selectLocalDataStorageState = createFeatureSelector<LocalDataStorageState>('localDataStorage');
