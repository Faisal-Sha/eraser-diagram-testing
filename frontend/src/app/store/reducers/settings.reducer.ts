import { createReducer, on, Action } from '@ngrx/store';
import * as SettingsActions from '../actions/settings.action';
import { SettingsState } from '../states/settings.state';

const settingsReducer = createReducer<SettingsState>({
    temporarySettings: null,
  },
  on(SettingsActions.update, (state, { settings }) => ({ temporarySettings: settings })),
  on(SettingsActions.discard, () => ({ temporarySettings: null }))
);

/**
 * Reducer function for handling settings-related actions.
 * This function is used by the Ngrx Store to update the state based on dispatched actions.
 *
 * @param state - The current state of the settings. If not provided, it will be initialized with default values.
 * @param action - The action object dispatched to the reducer.
 *
 * @returns The updated state after applying the action.
 */
export function reducer(state: SettingsState | undefined, action: Action) {
  return settingsReducer(state, action);
}