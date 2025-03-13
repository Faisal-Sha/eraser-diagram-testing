import { createAction, props } from '@ngrx/store';
import { Metadata } from 'src/app/interfaces/metadata.interface';

export const update = createAction("[Metadata] Update Metadata", props<Metadata>());
