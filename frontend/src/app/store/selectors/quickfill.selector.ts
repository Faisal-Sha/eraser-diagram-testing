import { createSelector } from "@ngrx/store";
import { selectLocalDataStorageState } from "./local-data-storage.selector";
import { LocalDataStorageState } from "../states/local-data-storage.state";


/**
 * Selects the quickfill from the quickfill state.
 */
export const selectQuickfill = createSelector(selectLocalDataStorageState, (state: LocalDataStorageState) => state.data.quickfill);
