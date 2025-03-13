import { Metadata } from "../../interfaces/metadata.interface";
import { Settings } from "../../interfaces/settings.interface";
import { Quickfill, UserPreset } from "../../interfaces/quickfill.interface";

export interface LocalDataStorage {
  version: `${number}.${number}.${number}`;
  settings: Settings;
  metadata: Metadata;
  quickfill: Quickfill;
  rootGroup: Record<string, any>;
}

export interface LocalDataStorageState {
  initialized: boolean;
  data: LocalDataStorage;
}
