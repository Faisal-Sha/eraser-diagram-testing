import { Injectable } from '@nestjs/common';
import { getMaterialFactor } from '../../constants/material';
import { ItemPipeFittingEntity } from '@common/entities/item/items/pipe-fitting.entity';
import { AttributeName } from '@common/interfaces/attribute.interface';

/**
 * Formats a number to a string with a maximum of 2 fractional digits and without thousand separators.
 *
 * @param value - The number to be formatted.
 * @returns The formatted number as a string.
 */
function formatNumber(value: number): string {
  return value.toLocaleString('de-DE', {
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

@Injectable()
export class EffordCalculateService {
  private calculationConditions = [
    {
        /**
         * Condition to check if the item is a seamless or welded pipe.
         * Item types 1000 to 1999 are considered as seamless or welded pipes.
         *
         * @param item - The item to be checked.
         * @returns True if the item is a seamless or welded pipe, false otherwise.
         */
      condition: (item: ItemPipeFittingEntity) => {
        // Rohr nahtlos & Rohr geschweißt
        const typeId = parseInt(item.typeId, 10);
        return typeId >= 1000 && typeId < 2000;
      },
        /**
         * Calculates the efford hours for a pipe.
         * The calculation consists of three parts: handling pipe, laying pipe and circular weld.
         * The efford for handling pipe is a fixed value based on the diameter.
         * The efford for laying pipe is a fixed value based on the diameter and wall thickness.
         * The efford for circular weld is a fixed value based on the diameter, wall thickness and material.
         * The total efford is the sum of the three parts.
         * The quantity for handling pipe and laying pipe is the quantity of the item.
         * The quantity for circular weld is the quantity of the item divided by 6.
         *
         * @param item - The item to be calculated.
         * @returns The total efford hours for the pipe.
         */
      calculation: (item: ItemPipeFittingEntity) => {
        const handlingPipeFactor = this.handlingPipe(item.dn1);
        const layingPipeFactor = this.layingPipe(item.dn1, item.s1);
        const circularWeldFactor = this.circularWeld(item.dn1, item.s1, item.material);

        item.setAttribute(AttributeName.CALCULATION_EFFORD_HOURS, {
          steps: [{
            name: 'handlingPipe',
            efford: handlingPipeFactor,
            quantity: item.quantity,
            size: `${formatNumber(item.dn1)}`
          }, {
            name: 'layingPipe',
            efford: layingPipeFactor,
            quantity: item.quantity,
            size: `${formatNumber(item.dn1)} x ${formatNumber(item.s1)}`
          }, {
            name: 'circularWeld',
            efford: circularWeldFactor,
            quantity: (item.quantity / 6),
            size: `${formatNumber(item.dn1)} x ${formatNumber(item.s1)}`
          }],
        });

        return (handlingPipeFactor * item.quantity) + (layingPipeFactor * item.quantity) + (circularWeldFactor * (item.quantity / 6));
      }
    },
    {
      condition: (item: ItemPipeFittingEntity) => {
        // Rohrbogen
        const typeId = parseInt(item.typeId, 10);
        return typeId >= 2000 && typeId < 3000;
      },
      calculation: (item: ItemPipeFittingEntity) => {
        const fitting2EndFactor = this.fitting2End(item.dn1);
        const circularWeldFactor = this.circularWeld(item.dn1, item.s1, item.material);

        item.setAttribute(AttributeName.CALCULATION_EFFORD_HOURS, {
          steps: [{
            name: 'fitting2End',
            efford: fitting2EndFactor,
            quantity: item.quantity,
            size: `${formatNumber(item.dn1)}`
          }, {
            name: 'circularWeld',
            efford: circularWeldFactor,
            quantity: (item.quantity * 2),
            size: `${formatNumber(item.dn1)} x ${formatNumber(item.s1)}`
          }]
        });

        return (fitting2EndFactor * item.quantity) + (circularWeldFactor) * (item.quantity * 2);
      }
    },
    {
      condition: (item: ItemPipeFittingEntity) => {
        // T-Stück
        const typeId = parseInt(item.typeId, 10);
        return typeId >= 3000 && typeId < 3100;
      },
      calculation: (item: ItemPipeFittingEntity) => {
        const fitting3EndFactor = this.fitting3End(item.dn1);
        const circularWeldFactor = this.circularWeld(item.dn1, item.s1, item.material);

        item.setAttribute(AttributeName.CALCULATION_EFFORD_HOURS, {
          steps: [{
            name: 'fitting3End',
            efford: fitting3EndFactor,
            quantity: item.quantity,
            size: `${formatNumber(item.dn1)}`
          }, {
            name: 'circularWeld',
            efford: circularWeldFactor,
            quantity: (item.quantity * 3),
            size: `${formatNumber(item.dn1)} x ${formatNumber(item.s1)}`
          }]
        });

        return (fitting3EndFactor * item.quantity) + (circularWeldFactor * (item.quantity * 3));
      }
    },
    {
      condition: (item: ItemPipeFittingEntity) => {
        // T-Stück reduziert
        const typeId = parseInt(item.typeId, 10);
        return typeId >= 3100 && typeId < 3200;
      },
      calculation: (item: ItemPipeFittingEntity) => {
        const fitting3EndFactor = this.fitting3End(item.dn1);
        const circularWeld1Factor = this.circularWeld(item.dn1, item.s1, item.material);
        const circularWeld2Factor = this.circularWeld(item.dn2, item.s2, item.material);

        item.setAttribute(AttributeName.CALCULATION_EFFORD_HOURS, {
          steps: [{
            name: 'fitting3End',
            efford: fitting3EndFactor,
            quantity: item.quantity,
            size: `${formatNumber(item.dn1)}`
          }, {
            name: 'circularWeld1',
            efford: circularWeld1Factor,
            quantity: (item.quantity * 2),
            size: `${formatNumber(item.dn1)} x ${formatNumber(item.s1)}`
          }, {
            name: 'circularWeld2',
            efford: circularWeld2Factor,
            quantity: item.quantity,
            size: `${formatNumber(item.dn2)} x ${formatNumber(item.s2)}`
          }]
        });

        return (fitting3EndFactor * item.quantity) + (circularWeld1Factor * (item.quantity * 2)) + (circularWeld2Factor * item.quantity);
      }
    },
    {
      condition: (item: ItemPipeFittingEntity) => {
        // Reduzierung
        const typeId = parseInt(item.typeId, 10);
        return typeId >= 4000 && typeId < 5000;
      },
      calculation: (item: ItemPipeFittingEntity) => {
        const fitting2EndFactor = this.fitting2End(item.dn1);
        const circularWeld1Factor = this.circularWeld(item.dn1, item.s1, item.material);
        const circularWeld2Factor = this.circularWeld(item.dn2, item.s2, item.material);

        item.setAttribute(AttributeName.CALCULATION_EFFORD_HOURS, {
          steps: [{
            name: 'fitting2End',
            efford: fitting2EndFactor,
            quantity: item.quantity,
            size: `${formatNumber(item.dn1)}`
          }, {
            name: 'circularWeld1',
            efford: circularWeld1Factor,
            quantity: item.quantity,
            size: `${formatNumber(item.dn1)} x ${formatNumber(item.s1)}`
          }, {
            name: 'circularWeld2',
            efford: circularWeld2Factor,
            quantity: item.quantity,
            size: `${formatNumber(item.dn2)} x ${formatNumber(item.s2)}`
          }]
        });

        return (fitting2EndFactor * item.quantity) + (circularWeld1Factor * item.quantity) + (circularWeld2Factor * item.quantity);
      }
    },
    {
      condition: (item: ItemPipeFittingEntity) => {
        // Kappe
        const typeId = parseInt(item.typeId, 10);
        return typeId >= 5000 && typeId < 6000;
      },
      calculation: (item: ItemPipeFittingEntity) => {
        const circularWeldFactor = this.circularWeld(item.dn1, item.s1, item.material);

        item.setAttribute(AttributeName.CALCULATION_EFFORD_HOURS, {
          steps: [{
            name: 'circularWeld',
            efford: circularWeldFactor,
            quantity: item.quantity,
            size: `${formatNumber(item.dn1)} x ${formatNumber(item.s1)}`
          }]
        });

        return circularWeldFactor * item.quantity;
      },
    },
    {
      condition: (item: ItemPipeFittingEntity) => {
        // Blindflansch
        const typeId = parseInt(item.typeId, 10);
        return typeId >= 6000 && typeId < 7000;
      },
      calculation: (item: ItemPipeFittingEntity) => {
        const flangedConnectionFactor = this.flangedConnection(item.dn1);

        item.setAttribute(AttributeName.CALCULATION_EFFORD_HOURS, {
          steps: [{
            name: 'flangedConnection',
            efford: flangedConnectionFactor,
            quantity: (item.quantity * 0.5),
            size: `${formatNumber(item.dn1)}`
          }]
        });

        return flangedConnectionFactor * (item.quantity * 0.5);
      }
    },
    {
      condition: (item: ItemPipeFittingEntity) => {
        // Vorschweißflansch
        const typeId = parseInt(item.typeId, 10);
        return typeId >= 7000 && typeId < 8000;
      },
      calculation: (item: ItemPipeFittingEntity) => {
        const circularWeldFactor = this.circularWeld(item.dn1, item.s1, item.material);
        const flangedConnectionFactor = this.flangedConnection(item.dn1);

        item.setAttribute(AttributeName.CALCULATION_EFFORD_HOURS, {
          steps: [{
            name: 'flangedConnection',
            efford: flangedConnectionFactor,
            quantity: (item.quantity * 0.5),
            size: `${formatNumber(item.dn1)}`
          }, {
            name: 'circularWeld',
            efford: circularWeldFactor,
            quantity: item.quantity,
            size: `${formatNumber(item.dn1)} x ${formatNumber(item.s1)}`
          }]
        });

        return (circularWeldFactor * item.quantity) + (flangedConnectionFactor * (item.quantity * 0.5));
      }
    }
  ];

  constructor() {}

  /**
   * Calculates the factor for a given pipe fitting item based on its type and attributes.
   *
   * @param item - The pipe fitting item for which the factor needs to be calculated.
   * @returns The calculated factor for the given item.
   * @throws Will throw an error if no calculation condition is found for the given item.
   */
  public calculateFactor(item: ItemPipeFittingEntity): number {
    const calculationCondition = this.calculationConditions.find((condition) =>
      condition.condition(item),
    );
    if (calculationCondition) {
      return calculationCondition.calculation(item as any);
    }
    throw new Error(
      'Calculation condition not found for ' + JSON.stringify(item),
    );
  }

  /**
   * Calculates the factor for handling a pipe based on its nominal diameter.
   *
   * @param diameterNominal - The nominal diameter of the pipe in millimeters.
   * @returns The calculated factor for handling the pipe.
   *
   * The handling pipe factor is calculated using the formula:
   * handlingPipeFactor = 0.001 * diameterNominal + 0.08
   */
  private handlingPipe(diameterNominal: number): number {
    return 0.001 * diameterNominal + 0.08;
  }

  /**
   * Calculates the factor for laying a pipe based on its nominal diameter and thickness.
   *
   * @param diameterNominal - The nominal diameter of the pipe in millimeters.
   * @param thk - The thickness of the pipe in millimeters.
   * @returns The calculated factor for laying the pipe.
   *
   * The laying pipe factor is calculated using the formula:
   * layingPipeFactor = 0.18 + 0.011 * thk + 0.00045 * diameterNominal * thk
   */
  private layingPipe(
    diameterNominal: number,
    thk: number
  ): number {
    return 0.18 + 0.011 * thk + 0.00045 * diameterNominal * thk;
  }

  /**
   * Calculates the factor for a 2-end fitting based on its nominal diameter.
   *
   * @param diameterNominal - The nominal diameter of the fitting in millimeters.
   * @returns The calculated factor for the 2-end fitting.
   *
   * The factor is calculated using the formula:
   * fitting2EndFactor = 0.032 + 0.00833 * diameterNominal
   */
  private fitting2End(diameterNominal: number): number {
    return 0.032 + 0.00833 * diameterNominal;
  }

  /**
   * Calculates the factor for a 3-end fitting based on its nominal diameter.
   *
   * @param diameterNominal - The nominal diameter of the fitting in millimeters.
   * @returns The calculated factor for the 3-end fitting.
   *
   * The factor is calculated using the formula:
   * fitting3EndFactor = (0.032 + 0.00833 * diameterNominal) * 1.3
   */
  private fitting3End(diameterNominal: number): number {
    return (0.032 + 0.00833 * diameterNominal) * 1.3;
  }

  /**
   * Calculates the factor for a circular weld based on its nominal diameter, thickness, and material.
   *
   * @param diameterNominal - The nominal diameter of the weld in millimeters.
   * @param thikness - The thickness of the weld in millimeters.
   * @param material - The material of the weld.
   *
   * @returns The calculated factor for the circular weld.
   *
   * The factor is calculated using a set of coefficients and a material factor.
   * The material factor is obtained from the `getMaterialFactor` function.
   *
   * The coefficients are constants used in the calculation.
   * The calculation is based on a polynomial equation with the given parameters.
   *
   * The material factor is multiplied with the result of the polynomial equation to obtain the final factor.
   */
  private circularWeld(
    diameterNominal: number,
    thikness: number,
    material: string
  ): number {
    const materialFactor = getMaterialFactor(material);

    const a1 = 0.33; // original: 0.32439
    const a2 = 0.009; // original: 0.0080924
    const a3 = -0.04; // original: -0.034598
    const a4 = -0.00000003; // original: -0.000000019955
    const a5 = 0.0035; // original: 0.0034199
    const a6 = -0.00000000008; // original: -0.000000000074256
    const a7 = -0.00012; // original: -0.00010971
    const a8 = 0.00037; // original: 0.00036256
    const a9 = 0.000000032; // original: 0.000000031452
    const a10 = 0.000027; // original: 0.00002624;
    return (a1 +
      a2 * diameterNominal +
      a3 * thikness +
      a4 * diameterNominal ** 2 +
      a5 * thikness ** 2 +
      a6 * diameterNominal ** 3 +
      a7 * thikness ** 3 +
      a8 * diameterNominal * thikness +
      a9 * diameterNominal ** 2 * thikness +
      a10 * diameterNominal * thikness ** 2) * materialFactor;
  }

  /**
   * Calculates the factor for a flanged connection based on its nominal diameter.
   *
   * @param diameterNominal - The nominal diameter of the flanged connection in millimeters.
   * @returns The calculated factor for the flanged connection.
   *
   * The factor is calculated using the formula:
   * flangedConnectionFactor = 0.48 + 0.0012 * diameterNominal ** 1.3
   */
  private flangedConnection(diameterNominal: number): number {
    return (0.48 + 0.0012 * diameterNominal ** 1.3);
  }
}
