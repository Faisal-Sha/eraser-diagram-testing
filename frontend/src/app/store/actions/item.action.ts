import { createAction, props } from '@ngrx/store';

/**
 * Update the root group.
 */
export const updateRootGroup = createAction('[Item] Update Root Group', props<{ rootGroup: Record<string, any> }>());