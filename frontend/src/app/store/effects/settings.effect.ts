import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, withLatestFrom } from 'rxjs/operators';
import * as SettingsActions from '../actions/settings.action';
import * as SettingsSelectors from '../selectors/settings.selector';
import * as LocalDataStorageActions from '../actions/local-data-storage.action';
import * as LocalDataStorageSelectors from '../selectors/local-data-storage.selector';
import { select, Store } from '@ngrx/store';

@Injectable()
export class SettingsEffects {

  constructor(
    private actions$: Actions,
    private store: Store
  ) {}
  
  /**
   * Effect to apply the settings.
   */
  apply$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SettingsActions.apply),
      withLatestFrom(
        this.store.pipe(select(SettingsSelectors.selectTemporary)),
        this.store.pipe(select(LocalDataStorageSelectors.selectLocalDataStorageState))
      ),
      map(([action, temporarySettings, localDataStorageState]) => {
        if (!temporarySettings) {
          console.warn('No temporary settings to apply');
          return SettingsActions.applyFailure({ error: new Error('No temporary settings to apply') });
        }

        this.store.dispatch(SettingsActions.discard());
        return LocalDataStorageActions.save({
          localDataStorage: {
            ...localDataStorageState.data,
            settings: temporarySettings
          }
        });
      })
    )
  );
}
