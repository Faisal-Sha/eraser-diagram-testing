import { createSelector } from "@ngrx/store";
import { selectLocalDataStorageState } from "./local-data-storage.selector";
import { LocalDataStorageState } from "../states/local-data-storage.state";

/**
 * Selects the root group from the item state.
 */
export const selectRootGroupJSON = createSelector(
  selectLocalDataStorageState,
  (state: LocalDataStorageState) => state.data.rootGroup
);
