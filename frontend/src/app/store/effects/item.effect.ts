import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as ItemActions from '../actions/item.action';
import { select, Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs';
import * as LocalDataStorageActions from '../actions/local-data-storage.action';
import * as LocalDataStorageSelectors from '../selectors/local-data-storage.selector';

@Injectable()
export class ItemEffects {

  /**
   * Constructs an instance of ItemEffects.
   *
   * @param actions$ The input actions.
   * @param store The store.
   */
  constructor(
    private actions$: Actions,
    private store: Store
  ) {}

  /**
   * Effect to update the root group.
   */
  updateRootGroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemActions.updateRootGroup),
      withLatestFrom(this.store.pipe(select(LocalDataStorageSelectors.selectLocalDataStorageState))),
      map(([action, localDataStorageState]) => {
        const localDataStorage = localDataStorageState.data;
        return LocalDataStorageActions.save({ localDataStorage: { ...localDataStorage, rootGroup: action.rootGroup } });
      })
    )
  );
}
