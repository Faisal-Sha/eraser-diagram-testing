export interface ItemStructure {
  /**
   * Columns of the item.
   */
  columns: ItemColumn[];

  /**
   * If the item can be split into manufacturing and installation.
   */
  manufacturingSplit?: boolean;
}

interface ItemBasics {
  /**
   * i18n key for the column title
   */
  i18nTitle: string;

  /**
   * i18n tooltip for the column title
   */
  i18nTooltip?: string;

  /**
   * i18n palceholder for the column editor
   */
  i18nPlaceholder?: string;

  /**
   * Key of the item property.
   * At the moment nested properties like price.value are not supported.
   */
  itemKey: string;

  /**
   * Type of the item property.
   */
  type: "number" | "string";

  /**
   * Optional: Width of the column in pixels.
   */
  width?: number;

  /**
   * Optional: Print width of the column in pixels.
   */
  printWidth?: number;

  /**
   * Optional: If the column is hidden for custom items.
   */
  hiddenForCustom?: boolean;

  /**
   * Optional: Options for custom items.
   */
  customItemOptions?: { label: string, value: string | number }[];
}

interface ItemColumnViewRenderer {
  /**
   * How to render the viewer.
   */
  viewRenderer: {
    type: "text",
  } | {
    type: "number",
    minDecimals?: number,
    maxDecimals?: number,
    grouping?: boolean
  } | {
    type: "suggestion"
  }
}

interface ItemColumnEditorRenderer {
  /**
   * How to render the editor.
   */
  editorRenderer: {
    type: "input",
    inputType: "text",
  } | {
    type: "input",
    inputType: "number",
    minDecimals?: number,
    maxDecimals?: number,
    grouping?: boolean
  } | {
    type: "select",
    options: { i18nLabel: string, value: string }[],
  } | {
    type: "suggestion"
  }
}

interface ItemColumnPrint {
  printOnly: true;
  isAttribute?: boolean;
}

type ItemCalculationColumn = ItemBasics & ItemColumnViewRenderer & ItemColumnEditorRenderer;
type ItemPrintColumn = ItemBasics & ItemColumnPrint;

export type ItemColumn = ItemCalculationColumn | ItemPrintColumn;


/**
 * Checks if the given column is an instance of `ItemCalculationColumn`.
 *
 * @param column - The column to be checked.
 * @returns `true` if the column is an instance of `ItemCalculationColumn`, `false` otherwise.
 *
 * @remarks
 * This function is used to determine if a column is intended for calculation purposes.
 * It checks if the `editorRenderer` property is present in the column object.
 *
 * @example
 */
export function isItemCalculationColumn(column: ItemColumn): column is ItemCalculationColumn {
  return !!(column as ItemCalculationColumn).editorRenderer;
}

/**
 * Checks if the given column is an instance of `ItemPrintColumn`.
 *
 * @param column - The column to be checked.
 * @returns `true` if the column is an instance of `ItemPrintColumn`, `false` otherwise.
 *
 * @remarks
 * This function is used to determine if a column is intended for printing purposes.
 * It checks if the `printOnly` property is present in the column object.
 *
 * @example
 * ```typescript
 * const columns: ItemColumn[] = [
 *   // ...
 *   { i18nTitle: 'Print Column', printOnly: true },
 *   // ...
 * ];
 *
 * if (isItemPrintColumn(columns[0])) {
 *   console.log('The first column is a print column.');
 * } else {
 *   console.log('The first column is not a print column.');
 * }
 * ```
 */
export function isItemPrintColumn(column: ItemColumn): column is ItemPrintColumn {
  return !!(column as ItemPrintColumn).printOnly;
}