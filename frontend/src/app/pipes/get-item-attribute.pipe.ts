import { Pipe, PipeTransform } from "@angular/core";
import { ItemEntity } from "@common/entities/item/item.entity";
import { AttributeName } from "@common/interfaces/attribute.interface";

@Pipe({
  name: 'getItemAttribute',
  standalone: true,
  pure: false
})
export class GetItemAttributePipe implements PipeTransform {
  constructor() { }

  /**
   * A pipe that retrieves the value of a specific attribute from an item entity.
   *
   * @param item - The item entity from which to retrieve the attribute.
   * @param attributeName - The name of the attribute to retrieve.
   *
   * @returns The value of the specified attribute.
   */
  transform(item: ItemEntity, attributeName: AttributeName) {
    return item.getAttribute(attributeName);
  }
}
