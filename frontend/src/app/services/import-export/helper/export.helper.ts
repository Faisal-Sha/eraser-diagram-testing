import { ItemGroupEntity } from "@common/entities/item/items/group.entity";
import { ItemPipeFittingEntity } from "@common/entities/item/items/pipe-fitting.entity";
import { ExportItem } from "../interfaces/export-item.interface";
import { firstValueFrom } from "rxjs";
import { CSVColumnConfig } from "../interfaces/csv-column-config.interface";

/**
 * Retrieves and filters the CSV column configurations based on their enabled status.
 *
 * @param csvColumnConfigs - An array of CSV column configurations to be filtered.
 *
 * @returns A promise that resolves to an array of filtered CSV column configurations.
 *
 * @remarks
 * This function uses asynchronous operations to evaluate the enabled status of each column configuration.
 * It filters out the column configurations based on their enabled status and returns the filtered array.
 *
 * @example
 * ```typescript
 * const filteredColumnConfigs = await getExportColumnConfigs(csvColumnConfigs);
 * console.log(filteredColumnConfigs);
 * ```
 */
export async function getExportColumnConfigs(csvColumnConfigs: CSVColumnConfig[]): Promise<CSVColumnConfig[]> {
  return (await Promise.all(csvColumnConfigs.map(async columnConfig => 
    [columnConfig, typeof columnConfig.export?.enabled === "function" ? await columnConfig.export.enabled() : !!columnConfig.export?.enabled]
  )).then(columnConfigs => columnConfigs.filter(([_, enabled]) => enabled).map(([columnConfig]) => columnConfig))) as CSVColumnConfig[];
}

/**
 * Generates an array of `ExportItem` objects representing items within a given item group.
 *
 * @param group - The item group from which to generate the export items.
 * @param path - The current path within the item group hierarchy. Defaults to an empty string.
 *
 * @returns An array of `ExportItem` objects representing items within the given item group.
 *
 * @remarks
 * This function recursively traverses the item group hierarchy, creating `ExportItem` objects for each
 * pipe fitting item found. It also generates the appropriate path for each item within the hierarchy.
 */
export function generateExportItems(group: ItemGroupEntity, path: string = ""): ExportItem[] {
  const items: ExportItem[] = [];
  group.items.forEach(item => {
    if (item instanceof ItemPipeFittingEntity) {
      const newPath = path + (path.length > 0 ? "/" : "") + group.name;
      items.push({ path: newPath, item });
    } else if (item instanceof ItemGroupEntity) {
      let newPath = path;
      if (group.id !== "root") {
        newPath = path + (path.length > 0 ? ("/" + group.name) : group.name);
      }
      items.push(...generateExportItems(item, newPath));
    }
  });
  return items;
}

/**
 * Generates a CSV header string based on the provided column configurations.
 *
 * @param columnConfigs - An array of CSV column configurations to be used for generating the CSV header.
 *
 * @returns A string containing the column names separated by semicolons.
 *
 * @example
 * const columnConfigs = [
 *   { name: "Gruppe" },
 *   { name: "Bauteil Name" },
 *   { name: "Menge" },
 * ];
 * const csvHeader = generateCSVHeader(columnConfigs);
 * console.log(csvHeader);
 * // Output: Gruppe;Bauteil Name;Menge
 */
export function generateCSVHeader(columnConfigs: CSVColumnConfig[]): string {
  return columnConfigs.map(columnConfig => columnConfig.name).join(";");
}

/**
 * Generates a CSV string representation of the export items based on the provided column configurations.
 *
 * @param columnConfigs - An array of CSV column configurations to be used for generating the CSV rows.
 * @param exportItems - An array of `ExportItem` objects representing items to be included in the CSV.
 *
 * @returns A promise that resolves to a CSV string containing the rows of export data.
 *
 * @remarks
 * This function uses asynchronous operations to transform each export item into a row of CSV data based on the provided column configurations.
 * It iterates over each export item and column configuration, applying the transform function to generate the cell value.
 * The transformed cell values are then joined with semicolons to form a CSV row.
 * The CSV rows are then joined with newlines to form the final CSV string.
 *
 * @example
 * ```typescript
 * const columnConfigs: CSVColumnConfig[] = [
 *   { name: "Item Name", export: { transform: (item, path) => item.name } },
 *   { name: "Item Path", export: { transform: (item, path) => path } },
 * ];
 * const exportItems: ExportItem[] = [
 *   { path: "Group1/PipeFitting1", item: new ItemPipeFittingEntity("PipeFitting1") },
 *   { path: "Group2/PipeFitting2", item: new ItemPipeFittingEntity("PipeFitting2") },
 * ];
 *
 * const csvString = await generateCSVRows(columnConfigs, exportItems);
 * console.log(csvString);
 * ```
 */
export async function generateCSVRows(columnConfigs: CSVColumnConfig[], exportItems: ExportItem[]): Promise<string> {
  const csvRows = await Promise.all(exportItems.map(async exportItem => {
    return (await Promise.all(columnConfigs.map(async columnConfig => {
      const transform = columnConfig.export?.transform;
      if (!transform) {
        return "";
      }
      return await transform(exportItem.item, exportItem.path);
    }))).join(";");
  }));

  return csvRows.join("\n");
}