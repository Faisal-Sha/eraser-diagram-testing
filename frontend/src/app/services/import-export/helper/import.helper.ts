import { ItemPipeFittingEntity } from "@common/entities/item/items/pipe-fitting.entity";
import { ItemGroupEntity } from "@common/entities/item/items/group.entity";
import { CSVColumnConfig } from "../interfaces/csv-column-config.interface";


/**
 * Retrieves the import column configurations that are enabled based on the provided CSV column configurations.
 *
 * @param csvColumnConfigs - An array of CSV column configurations.
 * @returns A promise that resolves to an array of enabled import column configurations.
 *
 * @remarks
 * This function iterates through the provided CSV column configurations and checks if each column's import configuration is enabled.
 * If the import configuration is a function, it awaits the result and checks if it is truthy.
 * If the import configuration is a boolean value, it directly checks if it is truthy.
 * The function then filters out the disabled import column configurations and returns the enabled ones.
 */
export async function getImportColumnConfigs(csvColumnConfigs: CSVColumnConfig[]): Promise<CSVColumnConfig[]> {
  return (await Promise.all(csvColumnConfigs.map(async column => 
    [column, typeof column.import?.enabled === "function" ? await column.import.enabled() : !!column.import?.enabled]
  )).then(fields => fields.filter(([_, enabled]) => enabled).map(([column]) => column))) as CSVColumnConfig[];
}

/**
 * Retrieves the required import column configurations based on the provided CSV column configurations.
 *
 * @param csvColumnConfigs - An array of CSV column configurations.
 * @returns A promise that resolves to an array of required import column configurations.
 *
 * @remarks
 * This function first calls the `getImportColumnConfigs` function to retrieve all enabled import column configurations.
 * Then, it maps over the enabled column configurations and checks if each column's required configuration is enabled.
 * If the required configuration is a function, it awaits the result and checks if it is truthy.
 * If the required configuration is a boolean value, it directly checks if it is truthy.
 * The function then filters out the non-required import column configurations and returns the required ones.
 */
export async function getRequiredImportColumnConfigs(csvColumnConfigs: CSVColumnConfig[]): Promise<CSVColumnConfig[]> {
  return await Promise.all((await getImportColumnConfigs(csvColumnConfigs)).map(async column => 
    [column, typeof column.import?.required === "function" ? await column.import.required() : !!column.import?.required]
  )).then(fields => fields.filter(([_, required]) => required).map(([column]) => column)) as CSVColumnConfig[];
}

/**
 * Validates the CSV parsing result and checks for required fields.
 *
 * @param result - The parsed CSV result from the Papa Parse library.
 * @param requiredColumnConfigs - An array of required column configurations for the CSV import.
 *
 * @throws Will throw an error if any of the following conditions are met:
 * - The CSV file contains parsing errors.
 * - No data is found in the CSV file.
 * - No fields are found in the CSV file.
 * - A required field is not found in the CSV file.
 *
 * @returns A promise that resolves to `void` if the validation passes successfully.
 */
export async function validateCSVResult(result: Papa.ParseResult<any>, requiredColumnConfigs: CSVColumnConfig[]): Promise<void> {
  if (result.errors.length > 0) {
    throw new Error("Error parsing CSV file:");
  }

  if (!result.data || result.data.length < 1) {
    throw new Error("No data found in CSV file");
  }

  if (!result?.meta?.fields || result.meta.fields.length < 2) {
    throw new Error("No fields found in CSV file");
  }

  for (const columnConfig of requiredColumnConfigs) {
    if (!result.meta.fields.includes(columnConfig.name)) {
      throw new Error(`Required field ${columnConfig.name} not found in CSV file`);
    }
  }
}

/**
 * Adds items to an item group from a CSV data array using the provided column configurations.
 *
 * @param group - The item group to which the items will be added.
 * @param data - An array of CSV data rows. Each row is represented as an object with column names as keys and values.
 * @param columnConfigs - An array of column configurations that define how to import and transform CSV data into item properties.
 *
 * @throws Will throw an error if a pipe fitting cannot be created from a CSV row.
 *
 * @returns A promise that resolves to `void` when all items have been added to the group successfully.
 */
export async function addCSVItemsToGroup(group: ItemGroupEntity, data: any[], columnConfigs: CSVColumnConfig[]): Promise<void> {
  for (const row of data) {
    const pipeFitting = await createPipeFittingFromCSVRow(row, columnConfigs);
    if (!pipeFitting) {
      throw new Error("Error creating pipe fitting from CSV row");
    }
    group.addItem(pipeFitting);
  }
}

/**
 * Creates a new `ItemPipeFittingEntity` instance from a CSV data row using the provided column configurations.
 *
 * @param row - An object representing a CSV data row with column names as keys and values.
 * @param columnConfigs - An array of `CSVColumnConfig` objects that define how to import and transform CSV data into item properties.
 *
 * @throws Will throw an error if a required property in the CSV column configuration is missing or if the transform function is not provided.
 *
 * @returns A promise that resolves to a new `ItemPipeFittingEntity` instance if successful, or `undefined` if an error occurs.
 */
async function createPipeFittingFromCSVRow(row: any, columnConfigs: CSVColumnConfig[]): Promise<ItemPipeFittingEntity | undefined> {
  const pipeFitting = new ItemPipeFittingEntity({});

  for (const field of columnConfigs) {
    const value = row[field.name];

    const targetKey = field.import?.targetKey;
    if (!targetKey) {
      throw new Error("No target key found in CSV column config");
    }

    if (!field.import?.transform) {
      throw new Error("No transform function found in CSV column config");
    }

    (pipeFitting as any)[targetKey] = await field.import.transform(field.name, value, pipeFitting, row);
  }
  return pipeFitting;
}

/**
 * Parses a value into a number, handling different formats and types.
 *
 * @param value - The value to parse. Can be a number, a string with a number format, or any other type.
 *
 * @returns The parsed number, or `undefined` if the value cannot be parsed into a number.
 *
 * @remarks
 * This function handles different formats and types of numbers. It checks if the value is already a number and returns it as is.
 * If the value is a string, it removes any existing decimal separators ('.') and replaces any commas (',') with decimal separators ('.').
 * Then, it attempts to parse the value as a floating-point number using `parseFloat`. If successful, it returns the parsed number.
 * If parsing as a floating-point number fails, it attempts to parse the value as an integer using `parseInt` with base 10. If successful, it returns the parsed integer.
 * If parsing as an integer fails, it returns `undefined`.
 */
export function parseNumberValue(value: any): number | undefined {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }
  value = value.replace(/\./g, "");

  if (value.includes(",")) {
    return parseFloat(value.replace(",", "."));
  }
  return parseInt(value, 10);
}