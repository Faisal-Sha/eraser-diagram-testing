import { createFeatureSelector, createSelector } from "@ngrx/store";
import { LocalDataStorageState } from "../states/local-data-storage.state";
import { selectLocalDataStorageState } from "./local-data-storage.selector";
import { Settings } from "src/app/interfaces/settings.interface";
import { SettingsState } from "../states/settings.state";

/**
 * Selects the temporary settings state from the store.
 */
export const selectSettingsState = createFeatureSelector<SettingsState>('settings');


/**
 * Selects the currently applied settings.
 */
export const selectApplied = createSelector(
  selectLocalDataStorageState,
  (state: LocalDataStorageState) => state.data.settings
);

/**
 * Selects the temporary settings.
 */
export const selectTemporary = createSelector(
  selectSettingsState,
  selectApplied,
  (settingsState: SettingsState, appliedSettings: Settings) => {
    if (settingsState?.temporarySettings) {
      return settingsState.temporarySettings;
    }
    // If there are no temporary settings, return the applied settings.
    return appliedSettings;
  }
);