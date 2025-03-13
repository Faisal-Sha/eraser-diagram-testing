import { createAction, props } from "@ngrx/store";
import { Settings } from "src/app/interfaces/settings.interface";


/**
 * Action to update the temporary settings.
 * To apply the settings, use the apply action.
 */
export const update = createAction('[Settings] Update', props<{ settings: Settings }>());

/**
 * Action to apply the temporary settings as the new settings.
 */
export const apply = createAction('[Settings] Apply');

/**
 * Action to handle the failure of applying the settings.
 */
export const applyFailure = createAction('[Settings] Apply Failure', props<{ error: Error }>());

/**
 * Action to discard the temporary settings.
 */
export const discard = createAction('[Settings] Discard');
