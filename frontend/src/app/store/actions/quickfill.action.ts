import { createAction, props } from '@ngrx/store';
import { Quickfill } from 'src/app/interfaces/quickfill.interface';

export const update = createAction("[Quickfill] Update Quickfill", props<{quickfill: Quickfill}>());
