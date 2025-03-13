import { ItemColumn, ItemStructure } from "../../../../interfaces/items/item-structure.interface";

const itemColumns: ItemColumn[] = [{
  i18nTitle: "pipefittings.column.quantity",
  i18nPlaceholder: "placeholder.quantity",
  itemKey: "quantity",
  type: "number",
  width: 125,
  printWidth: 40,
  hiddenForCustom: true,
  editorRenderer: {
    type: "input",
    inputType: "number",
    minDecimals: 0,
    maxDecimals: 4,
    grouping: true
  },
  viewRenderer: {
    type: "number",
    minDecimals: 0,
    maxDecimals: 4,
    grouping: true
  }
}, {
  i18nTitle: "pipefittings.column.typeId",
  i18nPlaceholder: "placeholder.typeId",
  itemKey: "typeId",
  type: "string",
  hiddenForCustom: true,
  width: 300,
  editorRenderer: {
    type: "suggestion"
  },
  viewRenderer: {
    type: "suggestion"
  }
}];

/**
 * This function returns an object representing the structure of an item,
 * including its columns and manufacturing split settings.
 *
 * @returns An object conforming to the {@link ItemStructure} interface,
 * containing the item's columns and manufacturing split setting.
 */
export default function (): ItemStructure {
  return {
    columns: itemColumns,
    manufacturingSplit: true
  };
}