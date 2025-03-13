import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, mergeMap, tap } from 'rxjs/operators';
import * as LocalDataStorageActions from '../actions/local-data-storage.action';
import { LocalDataStorage } from '../states/local-data-storage.state';
import { Store } from '@ngrx/store';
import { DataMigrationService } from 'src/app/services/data-migration/data-migration.service';

@Injectable()
export class LocalDataStorageEffects {

  constructor(
    private actions$: Actions,
    private store: Store,
    private dataMigrationService: DataMigrationService
  ) {}

  /**
   * Effect to load local data storage.
   */
  loadLocalDataStorage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LocalDataStorageActions.load),
      mergeMap(async () => {
        try {
          let item = localStorage.getItem(this.dataMigrationService.getLocalStorageKey());
          if (!item) {
            if (this.dataMigrationService.isMigrationNeeded()) {
              console.warn('Migrated local data storage found');
              const migratedItem = this.dataMigrationService.getMigratedItem();
              if (migratedItem) {
                console.warn('Migrated local data storage loaded');
                return LocalDataStorageActions.loadFromData({ data: migratedItem });
              }
            }
            return LocalDataStorageActions.loadFailure({ error: new Error('No local data storage found') });
          }
          const localDataStorage: LocalDataStorage = JSON.parse(item);
          if (!localDataStorage.version) {
            localDataStorage.version = this.dataMigrationService.getLatestVersion();
          }
          return LocalDataStorageActions.loadFromData({ data: localDataStorage });
        } catch (error: any) {
          return LocalDataStorageActions.loadFailure({ error });
        }
      })
    )
  );

  /**
   * Effect to load local data storage.
   */
  loadFromDataLocalDataStorage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LocalDataStorageActions.loadFromData),
      mergeMap(async (action) => {
        try {
          return LocalDataStorageActions.loadSuccess({ localDataStorage: action.data });
        } catch (error: any) {
          return LocalDataStorageActions.loadFailure({ error });
        }
      })
    )
  );

  /**
   * Effect to handle successful loading of local data storage.
   */
  loadLocalDataStorageFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LocalDataStorageActions.loadFailure),
      tap((action) => {
        console.warn('Error loading local data storage', action.error);
        return;
      })
    ),
    { dispatch: false }
  );


  /**
   * Effect to save local data storage.
   */
  saveLocalDataStorage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LocalDataStorageActions.save),
      map(action => {
        try {
          localStorage.setItem(this.dataMigrationService.getLocalStorageKey(), JSON.stringify(action.localDataStorage));
          if (!action.skipDispatch) {
            this.store.dispatch(LocalDataStorageActions.saveSuccess({ localDataStorage: action.localDataStorage }));
          }
        } catch(error: any) {
          if (!action.skipDispatch) {
            this.store.dispatch(LocalDataStorageActions.saveFailure({ error }));
          }
        }
      })
    ),
    { dispatch: false }
  );

  /**
   * Effect to handle successful saving of local data storage.
   */
  saveLocalDataStorageSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LocalDataStorageActions.saveSuccess),
      tap(async (action) => {})
    ),
    { dispatch: false }
  );

  /**
   * Effect to handle failed saving of local data storage.
   */
  saveLocalDataStorageFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LocalDataStorageActions.saveFailure),
      tap((action) => {
        console.warn('Error saving local data storage', action.error);
        return;
      })
    ),
    { dispatch: false }
  );
}
