import { ItemCategory, ItemUnit } from "@common/entities/item/item.entity";
import { cloneDeep } from "lodash";
import { CustomItemMode } from "src/app/interfaces/settings.interface";
import { LocalDataStorageState } from "src/app/store/states/local-data-storage.state";

import { v4 as uuidv4 } from 'uuid';

const FORMULA_REPLACEMENTS = {
  WEIGHT: 'GEWICHT',
  QUANTITY: 'MENGE',
  ENGIFY_INSTALLATION: 'AUFWAND_STUNDEN',
  ENGIFY_DELIVERY: 'PREIS_MATERIAL',
};

const nextDataStructure: LocalDataStorageState['data'] = {
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
    _items: [{
      "id": "e4450bca-2c31-4c4c-8641-8c0571d6ab74",
      "typeId": "0",
      "category": ItemCategory.GROUP,
      "name": "Beispiel Ordner",
      "contains": ItemCategory.GROUP,
      "expanded": true,
      "_items": [
        {
          "id": uuidv4(),
          "typeId": "0",
          "category": ItemCategory.GROUP,
          "name": "Beispiel Rohrleitung",
          "contains": ItemCategory.PIPEFITTING,
          "expanded": true,
          "_items": [
            {
              "id": uuidv4(),
              "typeId": "1000",
              "category": ItemCategory.PIPEFITTING,
              "quantity": 30,
              "material": "P235GH",
              "dn1": 114.3,
              "s1": 4.5
            },
            {
              "id": uuidv4(),
              "typeId": "2110",
              "category": ItemCategory.PIPEFITTING,
              "quantity": 5,
              "material": "P235GH",
              "dn1": 114.3,
              "s1": 4.5
            },
            {
              "id": uuidv4(),
              "typeId": "7020",
              "category": ItemCategory.PIPEFITTING,
              "quantity": 2,
              "material": "P250GH",
              "dn1": 114.3,
              "s1": 3.6
            }
          ]
        }
      ]
    }],
  },
  "quickfill": {
    "usedPresetId": 'isbl',
    "groups": [],
    "presets": []
  }
};


/**
 * This function is responsible for migrating data from an older version to the current version of the application.
 * It takes an object `data` as input, which represents the data from the older version.
 * The function performs various transformations and updates on the data to ensure compatibility with the current version.
 *
 * @param data - The input data object from the older version.
 * @returns The migrated data object that is compatible with the current version.
 */
export function run(data: any): any {
  const result = cloneDeep(nextDataStructure);
  if (!data) {
    return result;
  }

  // Update metadata fields
  if (data.metadata?.address) {
    result.metadata.address = data.metadata.address;
  }

  if (data.metadata?.author) {
    result.metadata.author = data.metadata.author;
  }

  if (data.metadata?.date) {
    result.metadata.date = data.metadata.date;
  }

  if (data.metadata?.version) {
    result.metadata.version = data.metadata.version;
  }

  if (data.metadata?.project) {
    result.metadata.project = data.metadata.project;
  }

  if (data.metadata?.description) {
    result.metadata.description = data.metadata.description;
  }

  // Update calculation settings
  if (data.settings?.calculation?.pricePerHour) {
    result.settings.calculation.hourlyMixedPrice = data.settings.calculation.pricePerHour;
  }

  if (data.settings?.visual?.logo) {
    result.settings.visual.logo = data.settings.visual.logo;
  }

  // Update formulas
  if (data.settings?.formulas) {
    const formulas = data.settings?.formulas?.filter((f: any) => f.name !== 'Beispiel Formel' || f.name === '')?.map((formula: any) => {
      let effordHours = formula?.calculation?.prices?.installation as string ?? null;
      if (effordHours) {
        const isPipeFittingFormula = formula?.conditions?.some((condition: any) => condition.option === 'id' && [1000, 1010].includes(condition.value));
        if (isPipeFittingFormula) {
          effordHours = effordHours.replace(/QUANTITY\s*\*\s*\(\s*1\s*\/\s*7\s*\)/g, 'QUANTITY*(1/6)');
        }

        Object.entries(FORMULA_REPLACEMENTS).forEach(([key, value]) => {
          effordHours = effordHours.replace(new RegExp(key, 'gi'), value);
        });

        if (effordHours.includes('PRICE_PER_HOUR')) {
          effordHours = effordHours.replace(/(\*|\+|\-|\/)?\s*PRICE_PER_HOUR\s*(\*|\+|\-|\/)?/g, function(match, p1, p2) {
            if (p1 && p2) return p1;
            return '';
          });
        }
      }


      let priceMaterial = formula?.calculation?.prices?.delivery as string ?? null;
      if (priceMaterial) {
        Object.entries(FORMULA_REPLACEMENTS).forEach(([key, value]) => {
          priceMaterial = priceMaterial.replace(new RegExp(key, 'g'), value);
        });
      }

      return {
        id: uuidv4(),
        name: formula.name,
        active: formula.active,
        conditions: formula?.conditions?.map((condition: any) => {
          if (condition.option === 'id') {
            condition.option = 'typeId';
            condition.value = condition.value.toString();
          }
          if (condition.option === 'thk1') {
            condition.option = 's1';
          }
          if (condition.option === 'thk2') {
            condition.option = 's2';
          }
          return condition;
        }) || [],
        calculation: {
          effordHours,
          priceMaterial
        }
      };
    }) || [];

    if (formulas.length > 0) {
      result.settings.formulas = formulas;
    }
  }

  // Update pipe fittings
  if (data.pipeFittings) {

    const items = data.pipeFittings?.map((pipeFitting: any) => {
      return {
        id: uuidv4(),
        typeId: pipeFitting?.id?.toString(),
        category: ItemCategory.PIPEFITTING,
        quantity: pipeFitting?.quantity,
        material: pipeFitting?.material,
        dn1: pipeFitting?.dn1,
        s1: pipeFitting?.thk1,
        dn2: pipeFitting?.dn2,
        s2: pipeFitting?.thk2
      };
    });

    if (items.length > 0) {
      const impotGroup = {
        "id": uuidv4(),
        "typeId": "0",
        "category": ItemCategory.GROUP,
        "name": "Migration aus v1.0.0",
        "contains": ItemCategory.PIPEFITTING,
        "expanded": true,
        "_items": items
      };

      result.rootGroup['_items'] = [impotGroup];
    }
  }

  return result;
}