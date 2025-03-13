import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, withLatestFrom } from 'rxjs/operators';
import * as LocalDataStorageActions from '../actions/local-data-storage.action';
import * as LocalDataStorageSelectors from '../selectors/local-data-storage.selector';
import * as QuickfillActions from '../actions/quickfill.action';
import { select, Store } from '@ngrx/store';

@Injectable()
export class QuickfillEffects {

  constructor(
    private actions$: Actions,
    private store: Store
  ) {}

  /**
   * Effect to update the metadata.
   */
  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuickfillActions.update),
      withLatestFrom(this.store.pipe(select(LocalDataStorageSelectors.selectLocalDataStorageState))),
      map(([action, localDataStorageState]) => {
        const localDataStorage = localDataStorageState.data;
        return LocalDataStorageActions.save({ localDataStorage: { ...localDataStorage, quickfill: action.quickfill } });
      })
    )
  );
}
