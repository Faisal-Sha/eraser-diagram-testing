import { createSelector } from "@ngrx/store";
import { selectLocalDataStorageState } from "./local-data-storage.selector";
import { LocalDataStorageState } from "../states/local-data-storage.state";


/**
 * Selects the metadata from the metadata state.
 */
export const selectMetadata = createSelector(
  selectLocalDataStorageState,
  (state: LocalDataStorageState) => state.data.metadata
);
