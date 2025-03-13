import { Injectable } from '@angular/core';
import { Migration, VersionFormat } from './interfaces/migration.interface';
import { run as runMigrationV1 } from './migrations/v1.migration';

const LOCAL_DATA_STORAGE_PREFIX = 'data-v';

@Injectable({
  providedIn: 'root'
})
export class DataMigrationService {

  private latestVersion: VersionFormat = '1.1.0';

  private migrations: Migration[] = [{
    version: '1.0.0',
    migrate: runMigrationV1
  }];

  constructor() {}

  /**
   * Retrieves the latest version of the data format.
   *
   * @returns The latest version of the data format as a string in the format 'x.y.z'.
   */
  public getLatestVersion(): VersionFormat {
    return this.latestVersion;
  }

  /**
   * Retrieves the local storage key for the specified version of the data format.
   * If no version is provided, the latest version will be used.
   *
   * @param version - The version of the data format. If not provided, the latest version will be used.
   * @returns The local storage key for the specified version of the data format.
   */
  public getLocalStorageKey(version?: VersionFormat): string {
    version = version || this.getLatestVersion();
    return `${LOCAL_DATA_STORAGE_PREFIX}${version}`;
  }

  /**
   * Checks if a migration is needed based on the local storage data.
   *
   * @returns `true` if a migration is required, `false` otherwise.
   *
   * @remarks
   * This function compares the version of the data stored in the local storage with the latest version
   * supported by the application. If the local storage data is not found or its version is outdated,
   * a migration is required.
   *
   * The function uses the `findRequiredMigrationIndex` method to determine the required migration index.
   * If the migration index is not -1, it means a migration is needed.
   *
   * @example
   * ```typescript
   * const migrationNeeded = dataMigrationService.isMigrationNeeded();
   * console.log(migrationNeeded); // Output: true or false
   * ```
   */
  public isMigrationNeeded(): boolean {
    const migrationIndex = this.findRequiredMigrationIndex();
    return migrationIndex !== -1;
  }

  /**
   * Retrieves the migrated item from the local storage based on the required migration.
   *
   * @returns The migrated item or `null` if no migration is required or an error occurs during migration.
   *
   * @remarks
   * This function checks if a migration is needed by comparing the version of the data stored in the local storage
   * with the latest version supported by the application. If a migration is required, it retrieves the local data,
   * applies the necessary migrations, and returns the migrated data. If no migration is required or an error occurs,
   * it returns `null`.
   *
   * The function uses the `findRequiredMigrationIndex` method to determine the required migration index.
   * If the migration index is not -1, it means a migration is needed. It then retrieves the local data for the required
   * migration version, applies the migration, and iterates through the remaining migrations to apply them sequentially.
   *
   * @example
   * ```typescript
   * const migratedItem = dataMigrationService.getMigratedItem();
   * console.log(migratedItem); // Output: The migrated item or null
   * ```
   */
  public getMigratedItem(): any {
    try {
      const migrationIndex = this.findRequiredMigrationIndex();
      if (migrationIndex === -1) {
        return null;
      }

      let localData = localStorage.getItem(this.getLocalStorageKey(this.migrations[migrationIndex].version));
      if (!localData) {
        return null
      }

      let migratedData = this.migrations[migrationIndex].migrate(JSON.parse(localData));

      for (let i = migrationIndex + 1; i < this.migrations.length; i++) {
        migratedData = this.migrations[i].migrate(migratedData);
      }

      return migratedData;
    } catch (error: any) {
      console.error('Error while migrating local data storage', error);
      return null;
    }
  }

  /**
   * Retrieves the migrated item based on the provided data and the required migration.
   *
   * @param data - The data to be migrated.
   * @returns The migrated item or `null` if no migration is required.
   *
   * @remarks
   * This function checks if a migration is needed for the provided data by comparing its version with the versions
   * supported by the application's migrations. If a migration is required, it applies the necessary migrations
   * to the provided data and returns the migrated data. If no migration is required, it returns the original data.
   *
   * The function uses the `findRequiredMigrationIndexForData` method to determine the required migration index.
   * If the migration index is not -1, it means a migration is needed. It then iterates through the remaining migrations
   * to apply them sequentially to the provided data.
   *
   * @example
   * ```typescript
   * const originalData = { version: '1.0.0', ... };
   * const migratedData = dataMigrationService.getMigratedItemForData(originalData);
   * console.log(migratedData); // Output: The migrated item or null
   * ```
   */
  public getMigratedItemForData(data: any): any {
    const migrationIndex = this.findRequiredMigrationIndexForData(data);
    if (migrationIndex === -1) {
      return null;
    }

    let migratedData = data;

    for (let i = migrationIndex; i < this.migrations.length; i++) {
      migratedData = this.migrations[i].migrate(migratedData);
    }

    return migratedData;
  }

  /**
   * Checks if a migration is needed for the provided data based on the versions supported by the application's migrations.
   *
   * @param data - The data to be checked for migration. The data object should have a `version` property indicating its version.
   * @returns `true` if a migration is required for the provided data, `false` otherwise.
   *
   * @remarks
   * This function compares the version of the provided data with the versions supported by the application's migrations.
   * If the provided data's version is outdated, a migration is required.
   *
   * The function uses the `findRequiredMigrationIndexForData` method to determine the required migration index.
   * If the migration index is not -1, it means a migration is needed.
   *
   * @example
   * ```typescript
   * const originalData = { version: '1.0.0', ... };
   * const migrationNeeded = dataMigrationService.isMigrationNeededForData(originalData);
   * console.log(migrationNeeded); // Output: true or false
   * ```
   */
  public isMigrationNeededForData(data: any): boolean {
    const migrationIndex = this.findRequiredMigrationIndexForData(data);
    return migrationIndex !== -1;
  }

  /**
   * Finds the index of the required migration based on the local storage data.
   *
   * @returns The index of the required migration, or -1 if no migration is required.
   *
   * @remarks
   * This function checks the local storage for data related to the latest version of the data format.
   * If data is found, it means no migration is required and -1 is returned.
   *
   * If no data is found, the function iterates through the migrations in reverse order.
   * For each migration, it retrieves the corresponding data from the local storage.
   * If data is found for a migration, the function returns the index of that migration.
   *
   * If no data is found for any migration, the function returns -1, indicating that no migration is required.
   *
   * @example
   * ```typescript
   * const requiredMigrationIndex = dataMigrationService.findRequiredMigrationIndex();
   * console.log(requiredMigrationIndex); // Output: The index of the required migration or -1
   * ```
   */
  private findRequiredMigrationIndex(): number {
    const data = localStorage.getItem(this.getLocalStorageKey());
    if (data) {
      return -1;
    }

    for (let i = this.migrations.length - 1; i >= 0; i--) {
      const migration = this.migrations[i];
      const data = localStorage.getItem(this.getLocalStorageKey(migration.version));
      if (data) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Finds the index of the required migration based on the provided data's version.
   *
   * @param data - The data to be checked for migration. The data object should have a `version` property indicating its version.
   *
   * @returns The index of the required migration, or -1 if no migration is required.
   *
   * @remarks
   * This function checks the provided data's version with the versions supported by the application's migrations.
   * If the provided data's version is outdated, a migration is required.
   *
   * The function iterates through the migrations in reverse order.
   * For each migration, it compares the data's version with the migration's version.
   * If a match is found, the function returns the index of that migration.
   *
   * If no match is found for any migration, the function returns -1, indicating that no migration is required.
   *
   * @example
   * ```typescript
   * const originalData = { version: '1.0.0', ... };
   * const requiredMigrationIndex = dataMigrationService.findRequiredMigrationIndexForData(originalData);
   * console.log(requiredMigrationIndex); // Output: The index of the required migration or -1
   * ```
   */
  private findRequiredMigrationIndexForData(data: any): number {
    const dataVersion = data.version ?? '1.0.0'; // default to 1.0.0 because 1.0.0 has no version field
    if (!dataVersion) {
      return -1;
    }

    for (let i = this.migrations.length - 1; i >= 0; i--) {
      const migration = this.migrations[i];
      if (dataVersion === migration.version) {
        return i;
      }
    }
    return -1;
  }
}
