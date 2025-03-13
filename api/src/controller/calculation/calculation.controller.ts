import { Body, Controller, Post } from '@nestjs/common';
import { MaterialCalculateService } from '../../services/material-calculate/material-calculate.service';
import { EffordCalculateService } from '../../services/efford-calculate/efford-calculate.service';
import { PipeFittingService } from '../../services/pipe-fitting/pipe-fitting.service';
import { CalculationRequest } from '@common/interfaces/calculation.interface';
import { instanciateItem } from '@common/entities/item/resolvers/item.resolver';
import { ItemPipeFittingEntity } from '@common/entities/item/items/pipe-fitting.entity';
import { AttributeName } from '@common/interfaces/attribute.interface';

@Controller('api/calculation')
export class CalculationController {
/**
 * Creates an instance of CalculationController.
 * 
 * @param materialCalculateService - Service to perform material calculations.
 * @param effordCalculateService - Service to calculate effort factors.
 * @param pipeFittingService - Service to handle pipe fitting calculations.
 */
  constructor(
    private materialCalculateService: MaterialCalculateService,
    private effordCalculateService: EffordCalculateService,
    private pipeFittingService: PipeFittingService
  ) { }

  /**
   * Handles the calculation request for various item types.
   *
   * @param calculationRequest - The request containing items for calculation.
   * @returns An object containing the calculated items with their attributes.
   *
   * @throws Will throw an error if no items are found in the request.
   * @throws Will throw an error if an item is not complete.
   * @throws Will throw an error if there is an issue calculating material or effort factors.
   */
  @Post()
  calculation(@Body() calculationRequest: CalculationRequest) {
    const items = calculationRequest.items;
    if (!items) {
      throw new Error('No items found');
    }

    const resultItems = items.map((item) => {
      item = instanciateItem(item);
      item.deleteAttributes();

      const errors = [];

      try {
        if (!item.isComplete()) {
          throw new Error(`Item with id ${item.id} not complete`);
        }

        if (item instanceof ItemPipeFittingEntity) {
          const weight = this.pipeFittingService.getPipeFittingWeight(item);
          item.setAttribute(AttributeName.WEIGHT, weight);

          const standard = this.pipeFittingService.getPipeFittingStandard(item);
          item.setAttribute(AttributeName.STANDARD, standard);

          try {
            item.setAttribute(AttributeName.PRICE_MATERIAL, this.materialCalculateService.calculate(item));
            item.setAttribute(AttributeName.EFFORD_HOURS, this.effordCalculateService.calculateFactor(item));
          } catch (e) {
            throw new Error(`Error calculating item with id ${item.id}: ${e.message}`);
          }
        }
      } catch (e) {
        console.error(e);
        item.deleteAttributes();
        errors.push({ message: e.message });
      }

      if (errors.length > 0) {
        item.setAttribute(AttributeName.ERRORS, errors);
      }
      return item;
    });

    return { items: resultItems.map((item) => ({
      id: item.id,
      attributes: item.attributes
    })) };
  }
}
