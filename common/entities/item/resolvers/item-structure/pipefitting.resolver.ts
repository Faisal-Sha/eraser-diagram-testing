import { AttributeName } from "../../../../interfaces/attribute.interface";
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
}, {
  i18nTitle: "pipefittings.column.standard",
  itemKey: AttributeName.STANDARD,
  type: "string",
  printOnly: true,
  isAttribute: true,
  printWidth: 100
}, {
  i18nTitle: "pipefittings.column.material",
  i18nPlaceholder: "placeholder.material",
  itemKey: "material",
  type: "string",
  width: 120,
  printWidth: 50,
  editorRenderer: {
    type: "suggestion"
  },
  viewRenderer: {
    type: "suggestion"
  },
  customItemOptions: [
    { label: 'P235GH', value: 'P235GH' },
    { label: 'P250GH', value: 'P250GH' },
    { label: 'P265GH', value: 'P265GH' },
    { label: '1.4539', value: '1.4539' },
    { label: '1.4571', value: '1.4571' },
  ]
}, {
  i18nTitle: "pipefittings.column.dn1",
  i18nPlaceholder: "placeholder.dn1",
  itemKey: "dn1",
  type: "number",
  width: 100,
  printWidth: 60,
  editorRenderer: {
    type: "suggestion"
  },
  viewRenderer: {
    type: "suggestion"
  },
  customItemOptions: [
    { label: '15', value: 21.3 },
    { label: '20', value: 26.9 },
    { label: '25', value: 33.7 },
    { label: '32', value: 42.4 },
    { label: '40', value: 48.3 },
    { label: '50', value: 60.3 },
    { label: '65', value: 76.1 },
    { label: '80', value: 88.9 },
    { label: '100', value: 114.3 },
    { label: '125', value: 139.7 },
    { label: '150', value: 168.3 },
    { label: '200', value: 219.1 },
    { label: '250', value: 273 },
    { label: '300', value: 323.9 },
    { label: '350', value: 355.6 },
    { label: '400', value: 406.4 },
    { label: '500', value: 508 },
    { label: '600', value: 610 }
  ]
}, {
  i18nTitle: "pipefittings.column.s1",
  i18nPlaceholder: "placeholder.s1",
  itemKey: "s1",
  type: "number",
  width: 100,
  printWidth: 40,
  editorRenderer: {
    type: "suggestion"
  },
  viewRenderer: {
    type: "suggestion"
  },
  customItemOptions: [
    { label: '1,6', value: 1.6 },
    { label: '2,0', value: 2.0 },
    { label: '2,3', value: 2.3 },
    { label: '2,6', value: 2.6 },
    { label: '2,9', value: 2.9 },
    { label: '3,2', value: 3.2 },
    { label: '3,6', value: 3.6 },
    { label: '4,0', value: 4.0 },
    { label: '4,5', value: 4.5 },
    { label: '5,0', value: 5.0 },
    { label: '5,6', value: 5.6 },
    { label: '6,3', value: 6.3 },
    { label: '7,1', value: 7.1 },
    { label: '8,0', value: 8.0 },
    { label: '8,8', value: 8.8 },
    { label: '10,0', value: 10.0 },
    { label: '11,0', value: 11.0 },
    { label: '12,5', value: 12.5 },
    { label: '14,2', value: 14.2 },
    { label: '16,0', value: 16.0 },
    { label: '17,5', value: 17.5 },
    { label: '20,0', value: 20.0 },
    { label: '22,2', value: 22.2 },
    { label: '25,0', value: 25.0 },
    { label: '28,0', value: 28.0 },
    { label: '30,0', value: 30.0 },
    { label: '32,0', value: 32.0 },
    { label: '36,0', value: 36.0 },
    { label: '40,0', value: 40.0 },
    { label: '45,0', value: 45.0 },
    { label: '50,0', value: 50.0 },
    { label: '60,0', value: 60.0 }
  ]
}, {
  i18nTitle: "pipefittings.column.dn2",
  i18nPlaceholder: "placeholder.dn2",
  itemKey: "dn2",
  type: "number",
  width: 100,
  printWidth: 60,
  editorRenderer: {
    type: "suggestion"
  },
  viewRenderer: {
    type: "suggestion"
  },
  customItemOptions: [
    { label: '15', value: 21.3 },
    { label: '20', value: 26.9 },
    { label: '25', value: 33.7 },
    { label: '32', value: 42.4 },
    { label: '40', value: 48.3 },
    { label: '50', value: 60.3 },
    { label: '65', value: 76.1 },
    { label: '80', value: 88.9 },
    { label: '100', value: 114.3 },
    { label: '125', value: 139.7 },
    { label: '150', value: 168.3 },
    { label: '200', value: 219.1 },
    { label: '250', value: 273 },
    { label: '300', value: 323.9 },
    { label: '350', value: 355.6 },
    { label: '400', value: 406.4 },
    { label: '500', value: 508 },
    { label: '600', value: 610 }
  ]
}, {
  i18nTitle: "pipefittings.column.s2",
  i18nPlaceholder: "placeholder.s2",
  itemKey: "s2",
  type: "number",
  width: 100,
  printWidth: 40,
  editorRenderer: {
    type: "suggestion"
  },
  viewRenderer: {
    type: "suggestion"
  },
  customItemOptions: [
    { label: '1,6', value: 1.6 },
    { label: '2,0', value: 2.0 },
    { label: '2,3', value: 2.3 },
    { label: '2,6', value: 2.6 },
    { label: '2,9', value: 2.9 },
    { label: '3,2', value: 3.2 },
    { label: '3,6', value: 3.6 },
    { label: '4,0', value: 4.0 },
    { label: '4,5', value: 4.5 },
    { label: '5,0', value: 5.0 },
    { label: '5,6', value: 5.6 },
    { label: '6,3', value: 6.3 },
    { label: '7,1', value: 7.1 },
    { label: '8,0', value: 8.0 },
    { label: '8,8', value: 8.8 },
    { label: '10,0', value: 10.0 },
    { label: '11,0', value: 11.0 },
    { label: '12,5', value: 12.5 },
    { label: '14,2', value: 14.2 },
    { label: '16,0', value: 16.0 },
    { label: '17,5', value: 17.5 },
    { label: '20,0', value: 20.0 },
    { label: '22,2', value: 22.2 },
    { label: '25,0', value: 25.0 },
    { label: '28,0', value: 28.0 },
    { label: '30,0', value: 30.0 },
    { label: '32,0', value: 32.0 },
    { label: '36,0', value: 36.0 },
    { label: '40,0', value: 40.0 },
    { label: '45,0', value: 45.0 },
    { label: '50,0', value: 50.0 },
    { label: '60,0', value: 60.0 }
  ]
}];

/**
 * This function returns the structure of an item, specifically for pipe fittings.
 * The structure includes columns for various attributes such as quantity, typeId, standard, material, DN1, S1, DN2, and S2.
 * It also indicates whether the item should be split during manufacturing.
 *
 * @returns An object representing the item structure with the following properties:
 * - `columns`: An array of `ItemColumn` objects, each representing a column in the item structure.
 * - `manufacturingSplit`: A boolean indicating whether the item should be split during manufacturing.
 */
export default function (): ItemStructure {
  return {
    columns: itemColumns,
    manufacturingSplit: true
  };
}