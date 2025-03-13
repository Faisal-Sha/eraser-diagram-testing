import { createReducer, on, Action } from '@ngrx/store';
import * as LocalDataStorageActions from '../actions/local-data-storage.action';
import { LocalDataStorage, LocalDataStorageState } from '../states/local-data-storage.state';
import { ItemCategory, ItemUnit } from '@common/entities/item/item.entity';
import { v4 as uuidv4 } from 'uuid'; 
import { cloneDeep, keys } from 'lodash';
import { CustomItemMode } from 'src/app/interfaces/settings.interface';

const DIRECT_MERGE_KEYS = ['rootGroup', 'date'];

/**
 * Initial state for local data storage.
 * Attention: If you change the model, you have to adjust the migrations as well.
 * @see DataMigrationService
 */
export const initialState: LocalDataStorageState = {
  initialized: false,
  data: {
    "version": '1.1.0',
    "settings": {
      "currency": {
        "symbol": '€',
        "exchangeRate": 1
      },
      "calculation": {
        "seperateManufacturingAssembly": false,
        "manufacturingSplitAmount": 40,
        "hourlyMixedPrice": 50,
        "hourlyManufacturingPrice": 40,
        "hourlyAssemblyPrice": 50
      },
      "visual": {
        "logo": null
      },
      "formulas": [{
        "id": uuidv4(),
        "name": "Beispiel Einheitspreis Rohre 1,8 € / kg",
        "active": false,
        "conditions": [
          {
            "option": "typeId",
            "operation": "eq",
            "value": "1000"
          }
        ],
        "calculation": {
          "effordHours": "AUFWAND_STUNDEN",
          "priceMaterial": "MENGE*GEWICHT*1,8"
        }
      }, {
        "id": uuidv4(),
        "name": "Beispiel Mengenrabatt (10 %) für V-Flansche ab 200 Stk.",
        "active": false,
        "conditions": [
          {
            "option": "typeId",
            "operation": "eq",
            "value": "7020"
          },
          {
            "option": "quantity",
            "operation": "gte",
            "value": "200"
          }
        ],
        "calculation": {
          "effordHours": "AUFWAND_STUNDEN",
          "priceMaterial": "PREIS_MATERIAL * 0,9"
        }
      }],
      "customItems": [{
        "id": "1000",
        "category": ItemCategory.PIPEFITTING,
        "typeId": "c-1000",
        "name": "Beispiel Loslager LC - HV",
        "unit": ItemUnit.PCS,
        "mode": CustomItemMode.CUSTOM_ITEM,
        "specifications": [
          {
            "columns": {
              "material": "Stahl",
              "dn1": 114.3,
              "s1": null,
              "dn2": null,
              "s2": null
            },
            "attributes": {
              "weight": 5.1,
              "effordHours": 0.46,
              "priceMaterial": 132.9
            }
          },
          {
            "columns": {
              "material": "Stahl",
              "dn1": 139.7,
              "s1": null,
              "dn2": null,
              "s2": null
            },
            "attributes": {
              "weight": 5.4,
              "effordHours": 0.47,
              "priceMaterial": 136.4
            }
          },
          {
            "columns": {
              "material": "Stahl",
              "dn1": 168.3,
              "s1": null,
              "dn2": null,
              "s2": null
            },
            "attributes": {
              "weight": 7.1,
              "effordHours": 0.53,
              "priceMaterial": 147.6
            }
          }
        ]
      }]
    },
    "metadata": {
      "address": 'Max Mustermann GmbH\nMusterstraße 1\n12345 Musterstadt',
      "author": 'Max Mustermann',
      "date": new Date(),
      "version": '1.0',
      "project": 'Beispielprojekt',
      "description": 'Beschreibung des Projekts'
    },
    "rootGroup": {
      id: 'root',
      name: 'Hauptgruppe',
      category: ItemCategory.GROUP,
      contains: ItemCategory.GROUP,
      _items: [],
    },
    "quickfill": {
      "usedPresetId": 'isbl',
      "groups": [],
      "presets": []
    }
  }
};

const localDataStorageReducer = createReducer(
  initialState,
  on(LocalDataStorageActions.loadSuccess, (state, { localDataStorage }) => ({
    initialized: true,
    data: recursiveMerge(localDataStorage, state.data, initialState.data) as LocalDataStorage
  })),
  on(LocalDataStorageActions.saveSuccess, (state, { localDataStorage }) => ({
    initialized: state.initialized,
    data: recursiveMerge(localDataStorage, state.data, initialState.data) as LocalDataStorage
  }))
);

/**
 * A function to merge new values into existing data, maintaining the original structure and default values.
 * It recursively compares the new values with the existing ones and initial values, and merges them accordingly.
 *
 * @param newValue - The new values to be merged.
 * @param previousValue - The existing values to be compared with the new ones.
 * @param initial - The initial values to be used as a fallback if neither the new nor the existing values are provided.
 *
 * @returns A new object with the merged values, maintaining the original structure and default values.
 */
function recursiveMerge(newValue: Record<string, any>, previousValue: Record<string, any>, initial: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  keys(initial).forEach(key => {
    if (newValue[key] && typeof newValue[key] === 'object' && !Array.isArray(newValue[key]) && !DIRECT_MERGE_KEYS.includes(key)) {
      // check if reference is the same
      if (newValue[key] === previousValue[key]) {
        result[key] = newValue[key];
      } else {
        result[key] = recursiveMerge(newValue[key], previousValue[key], initial[key]);
      }
    } else {
      let value = newValue[key];
      if (typeof value === 'undefined') {
        value = previousValue[key];
      }
      if (typeof value === 'undefined') {
        value = initial[key];
      }
      result[key] = cloneDeep(value);
    }
  });
  return result;
}

/**
 * The main reducer function for the local data storage state.
 * It handles the state changes based on the dispatched actions.
 *
 * @param state - The current state of the local data storage. If not provided, it will be initialized with the default state.
 * @param action - The action object that describes the type of change to be made to the state.
 *
 * @returns The new state of the local data storage after applying the action.
 *
 * @remarks
 * This reducer function uses the `localDataStorageReducer` to perform the actual state changes.
 * It ensures that the state is updated based on the provided action and returns the new state.
 */
export function reducer(state: LocalDataStorageState | undefined, action: Action) {
  return localDataStorageReducer(state, action);
}