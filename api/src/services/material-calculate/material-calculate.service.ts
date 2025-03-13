import { ItemPipeFittingEntity } from '@common/entities/item/items/pipe-fitting.entity';
import { AttributeName } from '@common/interfaces/attribute.interface';
import { safeEquals } from '@common/utils/operations.util';
import { Injectable } from '@nestjs/common';
import { MaterialFactorID, MaterialCalculation } from '@common/constants/calculation.const';

const FactorIdsOrder = [
    MaterialFactorID.UNIT_PRICE,
    MaterialFactorID.WEIGHT,
    MaterialFactorID.MATERIAL_SURCHARGE,
    MaterialFactorID.FORM_FACTOR,
    MaterialFactorID.QUANTITY
];

@Injectable()
export class MaterialCalculateService {

    private materialConditions = [{
        /**
         * Returns true if the type ID of the given item is either 1000 or 1010.
         * @param item The item to check.
         * @returns True if the type ID is 1000 or 1010, false otherwise.
         */
        condition: (item: ItemPipeFittingEntity) => {
            const typeId = parseInt(item.typeId, 10);
            return typeId === 1000 || typeId === 1010;
        },
        /**
         * Calculates the material price based on the type ID and material of the given item.
         * @param item The item to calculate the material price for.
         * @returns The calculated material price.
         */
        calculation: (item: ItemPipeFittingEntity) => {
            const typeId = parseInt(item.typeId, 10);
            const weight = item.getAttribute(AttributeName.WEIGHT) as number;

            let unitPrice;
            let materialSurcharge = 1;
            let formFactor = typeId === 1000 ? 1.2 : 1;

            switch (item.material) {
                case 'P235GH':
                    unitPrice = 1.5;
                break;
                case 'P250GH':
                    materialSurcharge = 1.1;
                    unitPrice = 1.5;
                break;
                case 'P265GH':
                    materialSurcharge = 1.25;
                    unitPrice = 1.5;
                break;
                case '1.4571':
                    unitPrice = 7.5;
                break;
                case '1.4539':
                    unitPrice = 15;
                break;
                default:
                    throw new Error('Material not found');
            }

            item.setAttribute(AttributeName.CALCULATION_MATERIAL, {
                factors: [
                    { id: MaterialFactorID.UNIT_PRICE, value: unitPrice },
                    { id: MaterialFactorID.MATERIAL_SURCHARGE, value: materialSurcharge },
                    { id: MaterialFactorID.FORM_FACTOR, value: formFactor },
                    { id: MaterialFactorID.WEIGHT, value: weight }
                ]
            });
            return unitPrice * weight * materialSurcharge * formFactor;
        }
    }, {
        condition: (item: ItemPipeFittingEntity) => {
            const typeId = parseInt(item.typeId, 10);
            return [2110, 2610, 2100, 2600].includes(typeId);
        },
        calculation: (item: ItemPipeFittingEntity) => {
            const typeId = parseInt(item.typeId, 10);
            const weight = item.getAttribute(AttributeName.WEIGHT) as number;

            let unitPrice;
            let materialSurcharge = 1;
            let formFactor = [2110, 2610].includes(typeId) ? 1 : 0.5;

            switch (item.material) {
                case 'P235GH':
                    unitPrice = 5.0;
                break;
                case 'P250GH':
                    materialSurcharge = 1.1;
                    unitPrice = 5.0;
                break;
                case 'P265GH':
                    materialSurcharge = 1.25;
                    unitPrice = 5.0;
                break;
                case '1.4571':
                    unitPrice = 20.0;
                break;
                case '1.4539':
                    unitPrice = 50.0;
                break;
                default:
                    throw new Error('Material not found');
            }

            item.setAttribute(AttributeName.CALCULATION_MATERIAL, {
                factors: [
                    { id: MaterialFactorID.UNIT_PRICE, value: unitPrice },
                    { id: MaterialFactorID.MATERIAL_SURCHARGE, value: materialSurcharge },
                    { id: MaterialFactorID.FORM_FACTOR, value: formFactor },
                    { id: MaterialFactorID.WEIGHT, value: weight }
                ]
            });
            return unitPrice * weight * materialSurcharge * formFactor;
        }
    }, {
        condition: (item: ItemPipeFittingEntity) => {
            const typeId = parseInt(item.typeId, 10);
            return typeId >= 3000 && typeId < 4000;
        },
        calculation: (item: ItemPipeFittingEntity) => {
            const weight = item.getAttribute(AttributeName.WEIGHT) as number;

            let unitPrice;
            let materialSurcharge = 1;
            
            switch (item.material) {
                case 'P235GH':
                    unitPrice = 5.0;
                break;
                case 'P250GH':
                    materialSurcharge = 1.1;
                    unitPrice = 5.0;
                break;
                case 'P265GH':
                    materialSurcharge = 1.25;
                    unitPrice = 5.0;
                break;
                case '1.4571':
                    unitPrice = 20.0;
                break;
                case '1.4539':
                    unitPrice = 50.0;
                break;
                default:
                    throw new Error('Material not found');
            }

            item.setAttribute(AttributeName.CALCULATION_MATERIAL, {
                factors: [
                    { id: MaterialFactorID.UNIT_PRICE, value: unitPrice },
                    { id: MaterialFactorID.MATERIAL_SURCHARGE, value: materialSurcharge },
                    { id: MaterialFactorID.WEIGHT, value: weight }
                ]
            });
            return unitPrice * weight * materialSurcharge;
        }
    }, {
        condition: (item: ItemPipeFittingEntity) => {
            const typeId = parseInt(item.typeId, 10);
            return typeId >= 4000 && typeId < 5000;
        },
        calculation: (item: ItemPipeFittingEntity) => {
            const weight = item.getAttribute(AttributeName.WEIGHT) as number;

            let unitPrice;
            let materialSurcharge = 1;
            
            switch (item.material) {
                case 'P235GH':
                    unitPrice = 5.0;
                break;
                case 'P250GH':
                    materialSurcharge = 1.1;
                    unitPrice = 5.0;
                break;
                case 'P265GH':
                    materialSurcharge = 1.25;
                    unitPrice = 5.0;
                break;
                case '1.4571':
                    unitPrice = 20.0;
                break;
                case '1.4539':
                    unitPrice = 50.0;
                break;
                default:
                    throw new Error('Material not found');
            }

            item.setAttribute(AttributeName.CALCULATION_MATERIAL, {
                factors: [
                    { id: MaterialFactorID.UNIT_PRICE, value: unitPrice },
                    { id: MaterialFactorID.MATERIAL_SURCHARGE, value: materialSurcharge },
                    { id: MaterialFactorID.WEIGHT, value: weight }
                ]
            });
            return unitPrice * weight * materialSurcharge;
        }
    }, {
        condition: (item: ItemPipeFittingEntity) => {
            const typeId = parseInt(item.typeId, 10);
            return typeId >= 5000 && typeId < 6000;
        },
        calculation: (item: ItemPipeFittingEntity) => {
            const weight = item.getAttribute(AttributeName.WEIGHT) as number;

            let unitPrice;
            let materialSurcharge = 1;

            switch (item.material) {
                case 'P235GH':
                    unitPrice = 5.0;
                break;
                case 'P250GH':
                    materialSurcharge = 1.1;
                    unitPrice = 5.0;
                break;
                case 'P265GH':
                    materialSurcharge = 1.25;
                    unitPrice = 5.0;
                break;
                case '1.4571':
                    unitPrice = 20.0;
                break;
                case '1.4539':
                    unitPrice = 50.0;
                break;
                default:
                    throw new Error('Material not found');
            }

            item.setAttribute(AttributeName.CALCULATION_MATERIAL, {
                factors: [
                    { id: MaterialFactorID.UNIT_PRICE, value: unitPrice },
                    { id: MaterialFactorID.MATERIAL_SURCHARGE, value: materialSurcharge },
                    { id: MaterialFactorID.WEIGHT, value: weight }
                ]
            });
            return unitPrice * weight * materialSurcharge;
        }
    }, {
        condition: (item: ItemPipeFittingEntity) => {
            const typeId = parseInt(item.typeId, 10);
            return typeId >= 6000 && typeId < 8000;
        },
        calculation: (item: ItemPipeFittingEntity) => {
            const typeId = parseInt(item.typeId, 10);
            const weight = item.getAttribute(AttributeName.WEIGHT) as number;

            let unitPrice;
            let materialSurcharge = 1;
            let formFactor = typeId >= 7000 && typeId < 8000 ? 1 : 0.75;

            switch (item.material) {
                case 'P235GH':
                    unitPrice = 3.0;
                break;
                case 'P250GH':
                    materialSurcharge = 1.1;
                    unitPrice = 3.0;
                break;
                case 'P265GH':
                    materialSurcharge = 1.25;
                    unitPrice = 3.0;
                break;
                case '1.4571':
                    unitPrice = 10.0;
                break;
                case '1.4539':
                    unitPrice = 25.0;
                break;
                default:
                    throw new Error('Material not found');
            }

            item.setAttribute(AttributeName.CALCULATION_MATERIAL, {
                factors: [
                    { id: MaterialFactorID.UNIT_PRICE, value: unitPrice },
                    { id: MaterialFactorID.MATERIAL_SURCHARGE, value: materialSurcharge },
                    { id: MaterialFactorID.FORM_FACTOR, value: formFactor },
                    { id: MaterialFactorID.WEIGHT, value: weight }
                ]
            } as MaterialCalculation);
            return unitPrice * weight * materialSurcharge * formFactor;
        }
    }];

    /**
     * Calculates the total material cost for a given pipe fitting item based on its type ID, material, and quantity.
     * The calculation is performed using the material conditions defined in the `materialConditions` array.
     * The calculated factors are stored in the `CALCULATION_MATERIAL` attribute of the item.
     *
     * @param item - The pipe fitting item to calculate the material cost for.
     * @throws Will throw an error if a manufacturing condition is not found for the given item.
     * @returns The total material cost for the given item.
     */
    public calculate(item: ItemPipeFittingEntity): number {
        const materialCondition = this.materialConditions.find(condition => condition.condition(item));
        if (materialCondition) {
            const result = materialCondition.calculation(item) * item.quantity;
            const calculation = item.getAttribute(AttributeName.CALCULATION_MATERIAL) as MaterialCalculation || {};

            calculation.factors = (calculation?.factors || []);
            calculation.factors = calculation.factors.filter(factor => typeof factor.value !== 'undefined' && !safeEquals(factor.value, 1));
            calculation.factors.push({
                id: MaterialFactorID.QUANTITY,
                value: item.quantity
            });

            calculation.factors = calculation.factors.sort((a, b) => FactorIdsOrder.indexOf(a.id) - FactorIdsOrder.indexOf(b.id));
            calculation.formula = calculation.factors.map(factor => factor.id).join(' * ');

            item.setAttribute(AttributeName.CALCULATION_MATERIAL, calculation);
            return result;
        }
        throw new Error('Manufacturing condition not found');
    }
}