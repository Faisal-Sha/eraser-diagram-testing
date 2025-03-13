import { Injectable } from '@nestjs/common';
import { CsvParser } from 'nest-csv-parser';
import * as fs from 'fs';
import { safeEquals } from '@common/utils/operations.util';
import { getMaterialDensity, getMaterialExampleType, getMaterialType } from '../../constants/material';
import { DIAMETER_NOMINAL_LABELS } from '@common/constants/diameter-nominal.const';
import { ItemPipeFittingEntity } from '@common/entities/item/items/pipe-fitting.entity';
import { instanciateItem } from '@common/entities/item/resolvers/item.resolver';
import { ItemCategory } from '@common/entities/item/item.entity';
import { AttributeName } from '@common/interfaces/attribute.interface';

class CSVPipeFitting {
  PipeFittingID: number;
  Standard: string;
  MaterialID: string;
  PipeFittingname: string;
  Model: string;
  Type: string;
  D1: number;
  D2: number;
  Series: string;
  THK1: number;
  THK2: number;
  PN: number;
  DN: number;
  THK: number;
  Weight: number;
}

const PIPE_FITTING_NUMBER_FIELDS: (keyof ItemPipeFittingEntity)[] = ['dn1', 'dn2', 's1', 's2'];

type RuleLookup<T extends ItemPipeFittingEntity> = {
  condition: (item: T) => boolean;
  csvAttributeMapping?: {
    [K in keyof Omit<T, 'typeId'>]?: keyof CSVPipeFitting;
  };
  transformer?: {
    [K in keyof T]?: (value: T[K]) => any;
  };
  weightTransformer?: (weight: number) => number;
};

type RuleCustom<T extends ItemPipeFittingEntity> = {
  condition: (item: T) => boolean;
  customWeight: (item: T) => number;
  standard?: (item: T) => any;
}

/**
 * Checks if the provided rule set is a custom rule set.
 * A custom rule set is identified by the presence of a custom weight function.
 *
 * @param entityRuleSet - The rule set to check.
 * @returns True if the rule set is a custom rule set, false otherwise.
 */
export function isRuleCustom(entityRuleSet: RuleSet): entityRuleSet is RuleCustom<ItemPipeFittingEntity> {
  return (entityRuleSet as RuleCustom<ItemPipeFittingEntity>)?.customWeight !== undefined;
}

type RuleSet = RuleLookup<ItemPipeFittingEntity> | RuleCustom<ItemPipeFittingEntity>;

const RULE_SETS: RuleSet[] = [{
  condition: (item: ItemPipeFittingEntity) => {
    const typeId = parseInt(item.typeId, 10);
    return typeId >= 1000 && typeId < 2000;
  },
  customWeight: (item: ItemPipeFittingEntity) => {
    const materialDensity = getMaterialDensity(item.material);
    const dn1Value = item.dn1;
    return ((3.14 * dn1Value ** 2 / 4) - (3.14 * (dn1Value - 2 * item.s1) ** 2 / 4)) * 0.001 * materialDensity;
  },
  standard: (pipeFitting) => {
    if (getMaterialType(pipeFitting.material) === 'N') {
      return 'DIN EN 10220';
    }
    return 'DIN EN ISO 1127';
  }
}, {
  condition: (item: ItemPipeFittingEntity) => {
    const typeId = parseInt(item.typeId, 10);
    return (typeId >= 2000 && typeId < 3000 && typeId.toString().substring(2, 4) === '10') ||
      (typeId >= 3000 && typeId < 3100) ||
      (typeId >= 5000 && typeId < 6000);
  },
  csvAttributeMapping: {
    material: 'MaterialID',
    dn1: 'D1',
    s1: 'THK1'
  },
  transformer: {
    material: (material) => getMaterialType(material)
  }
}, {
  condition: (item: ItemPipeFittingEntity) => {
    const typeId = parseInt(item.typeId, 10);
    return typeId >= 2000 && typeId < 3000 && typeId.toString().substring(2, 4) === '00';
  },
  csvAttributeMapping: {
    material: 'MaterialID',
    dn1: 'D1',
    s1: 'THK1'
  },
  transformer: {
    typeId: (typeId) => {
      let typeIdNumber = parseInt(typeId, 10);
      typeIdNumber += 10;
      return typeIdNumber.toString();
    },
    material: (material) => getMaterialType(material)
  }
}, {
  condition: (item: ItemPipeFittingEntity) => {
    const typeId = parseInt(item.typeId, 10);
    return (typeId >= 3100 && typeId < 3200) ||
      (typeId >= 4000 && typeId < 5000);
  },
  csvAttributeMapping: {
    material: 'MaterialID',
    dn1: 'D1',
    s1: 'THK1',
    dn2: 'D2',
    s2: 'THK2'
  },
  transformer: {
    material: (material) => getMaterialType(material)
  }
} as RuleLookup<ItemPipeFittingEntity>, {
  condition: (item: ItemPipeFittingEntity) => {
    const typeId = parseInt(item.typeId, 10);
    return typeId >= 6000 && typeId < 7000;
  },
  csvAttributeMapping: {
    material: 'MaterialID',
    dn1: 'DN'
  },
  transformer: {
    material: (material) => getMaterialType(material)
  }
}, {
  condition: (item: ItemPipeFittingEntity) => {
    const typeId = parseInt(item.typeId, 10);
    return typeId >= 7000 && typeId < 14000;
  },
  csvAttributeMapping: {
    material: 'MaterialID',
    dn1: 'DN',
    s1: 'THK'
  },
  transformer: {
    material: (material) => getMaterialType(material)
  }
}];

@Injectable()
export class PipeFittingService {
  private groupedPipeFittings: { [key: number]: ItemPipeFittingEntity[] };

  /**
   * Constructs a PipeFittingService with a CsvParser.
   * @param csvParser The CsvParser to use for parsing the CSV file.
   */
  constructor(
    private readonly csvParser: CsvParser
  ) {
    this.groupedPipeFittings = {};
  }

  /**
   * Parses a CSV file containing pipe fitting data and groups the data by typeId.
   * It also creates elbow 45° from elbow 90° based on the typeId.
   *
   * @throws Will throw an error if a ruleset is not found for a pipe fitting.
   */
  public async parse() {
    const stream = fs.createReadStream(process.cwd() + '/src/assets/deliverycosts_calculation.csv')
    const csvEntities = (await this.csvParser.parse(stream, CSVPipeFitting, null, null, { strict: true, separator: ';' })).list.filter((csvPipeFitting: CSVPipeFitting) => csvPipeFitting.PipeFittingID && csvPipeFitting.Weight);

    csvEntities.forEach((csvPipeFitting) => {
      if (!csvPipeFitting.MaterialID) {
        return;
      }

      const pipeFittingId = parseInt(csvPipeFitting.PipeFittingID, 10);
      if (typeof this.groupedPipeFittings[pipeFittingId] === 'undefined') {
        this.groupedPipeFittings[pipeFittingId] = [];
      }

      const item = instanciateItem({
        typeId: pipeFittingId.toString(),
        category: ItemCategory.PIPEFITTING,
        quantity: 1,
        material: getMaterialExampleType('N')
      } as any) as ItemPipeFittingEntity;

      item.setAttribute(AttributeName.WEIGHT, parseFloat(csvPipeFitting.Weight));
      item.setAttribute(AttributeName.STANDARD, csvPipeFitting.Standard);

      const ruleset = this.getRuleset(item);
      if (!ruleset) {
        throw new Error('Ruleset not found for ' + JSON.stringify(item));
      }

      if (isRuleCustom(ruleset)) { 
        return; 
      }

      const mapping = ruleset.csvAttributeMapping;
      Object.keys(mapping).forEach((key) => {
        const result = csvPipeFitting[mapping[key]];
        if (PIPE_FITTING_NUMBER_FIELDS.includes(key as keyof ItemPipeFittingEntity)) {
          item[key] = result.includes('.') ? parseFloat(result) : parseInt(result, 10);
        } else {
          item[key] = result;
        }

        if (key === 'material') {
          item[key] = getMaterialExampleType(item[key] as 'N' | 'S');
        }
      });

      if (item.dn1 && !DIAMETER_NOMINAL_LABELS?.[item.dn1]) {
        item.dn1 = null;
      }
      if (item.dn2 && !DIAMETER_NOMINAL_LABELS?.[item.dn2]) {
        item.dn2 = null;
      }
      
      if (!item.isComplete()) {
        return;
      }

      this.groupedPipeFittings[pipeFittingId].push(item);

      // create elbow 45° from elbow 90°
      const typeId = parseInt(item.typeId, 10);
      if (typeId === 2110 || typeId === 2610) {
        const clonedItem = instanciateItem(item);
        const newTypeId = typeId - 10;
        clonedItem.typeId = newTypeId.toString();
        clonedItem.setAttribute(AttributeName.WEIGHT, (clonedItem.getAttribute(AttributeName.WEIGHT) as number) / 2);

        if (typeof this.groupedPipeFittings[clonedItem.typeId] === 'undefined') {
          this.groupedPipeFittings[clonedItem.typeId] = [];
        }
        this.groupedPipeFittings[clonedItem.typeId].push(clonedItem);
      }
    }); 
  }

  /**
   * Retrieves a list of available pipe fitting IDs from the grouped pipe fittings.
   *
   * @returns A list of pipe fitting IDs as strings.
   */
  public getAvailablePipeFittingIDs(): string[] {
    return Object.keys(this.groupedPipeFittings).map((typeId) => typeId);
  }

  /**
   * Retrieves the ruleset for the given pipe fitting entity.
   * 
   * @param item - The pipe fitting entity for which to retrieve the ruleset.
   * @returns The ruleset that matches the given pipe fitting entity or undefined if no ruleset is found.
   */
  public getRuleset(item: ItemPipeFittingEntity): RuleSet | undefined {
    return RULE_SETS.find((rule) => rule.condition(item));
  }

  /**
   * Transforms a value of a pipe fitting entity based on the provided ruleset and key.
   *
   * @param item - The pipe fitting entity to transform the value from.
   * @param ruleset - The ruleset to use for transforming the value.
   * @param key - The key of the value to transform.
   *
   * @returns The transformed value of the pipe fitting entity.
   *
   * @throws Will throw an error if the transformer for the given key is not defined in the ruleset.
   */
  public transformValue<K extends keyof ItemPipeFittingEntity>(item: ItemPipeFittingEntity, ruleset: RuleLookup<ItemPipeFittingEntity>, key: K): ItemPipeFittingEntity[K] {
    const { transformer } = ruleset || {};
    if (typeof transformer?.[key] !== 'undefined') {
      return transformer[key](item?.[key]);
    }
    return item?.[key];
  }

  /**
   * Finds and returns a list of pipe fittings that match the given item's attributes.
   * If no typeId is provided in the item, it returns all pipe fittings.
   *
   * @param item - The pipe fitting entity to match.
   * @param untilColumn - (Optional) The column name until which to match the attributes.
   * @returns A list of pipe fittings that match the given item's attributes.
   */
  public findPipeFittings(item: ItemPipeFittingEntity, untilColumn?: string): ItemPipeFittingEntity[] {

    if (!item.typeId) {
      return Object.values(this.groupedPipeFittings).reduce((acc, groupPipeFittings) => acc.concat(groupPipeFittings), []);
    }

    const pipeFittingGroup = this.groupedPipeFittings[this.transformValue(item, this.getRuleset(item), 'typeId')];
    if (!pipeFittingGroup) {
      return [];
    }

    const pipeFittingKeys = item.getRelevantColumnList();
    if (untilColumn) {
      const untilColumnIndex = pipeFittingKeys.indexOf(untilColumn);
      if (untilColumnIndex !== -1) {
        pipeFittingKeys.splice(untilColumnIndex);
      }
    }

    // remove quantity 
    const quantityIndex = pipeFittingKeys.indexOf('quantity');
    if (quantityIndex !== -1) {
      pipeFittingKeys.splice(quantityIndex, 1);
    }

    return pipeFittingGroup.filter((groupPipeFitting) => pipeFittingKeys.every((key) => 
      safeEquals(this.transformValue(item, this.getRuleset(item), key as keyof ItemPipeFittingEntity), this.transformValue(groupPipeFitting, this.getRuleset(groupPipeFitting), key as keyof ItemPipeFittingEntity))
    ));
  }

  /**
   * Calculates and returns the weight of a pipe fitting based on its attributes.
   * If a custom ruleset is found, it uses the custom weight function.
   * Otherwise, it finds the exact pipe fitting from the database and returns its weight.
   *
   * @param item - The pipe fitting entity for which the weight needs to be calculated.
   * @returns The weight of the pipe fitting.
   * @throws Will throw an error if the ruleset is not found or if the pipe fitting is not found in the database.
   */
  public getPipeFittingWeight(item: ItemPipeFittingEntity): number {
    const ruleset = this.getRuleset(item);
    if (!ruleset) {
      throw new Error('Ruleset not found for ' + JSON.stringify(item));
    }

    if (isRuleCustom(ruleset)) {
      return ruleset.customWeight(item);
    }

    const pipeFittings = this.findPipeFittings(item);
    if (pipeFittings.length === 0) {
      throw new Error('Pipe Fitting not found');
    }

    if (pipeFittings.length > 1) {
      throw new Error('Multiple Pipe Fittings found');
    }

    return pipeFittings[0].getAttribute(AttributeName.WEIGHT) as number;
  }

  /**
   * Retrieves the standard of a pipe fitting based on its attributes.
   * If a custom ruleset is found, it uses the custom standard function.
   * Otherwise, it finds the exact pipe fitting from the database and returns its standard.
   *
   * @param item - The pipe fitting entity for which the standard needs to be retrieved.
   * @returns The standard of the pipe fitting or null if not found.
   * @throws Will throw an error if the ruleset is not found or if the pipe fitting is not found in the database.
   */
  public getPipeFittingStandard(item: ItemPipeFittingEntity): string | null {
    const ruleset = this.getRuleset(item);
    if (!ruleset) {
      return null;
    }

    if (isRuleCustom(ruleset)) {
      if (ruleset.standard) {
        return ruleset.standard(item);
      }
      return null;
    }

    const pipeFittings = this.findPipeFittings(item);
    if (pipeFittings.length === 1) {
      return pipeFittings[0].getAttribute(AttributeName.STANDARD) as string;
    }
    return null;
  }
}
