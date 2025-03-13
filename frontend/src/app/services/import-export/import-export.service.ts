import { Injectable } from "@angular/core";
import { DIAMETER_NOMINAL_LABELS } from "@common/constants/diameter-nominal.const";
import { ItemCategory } from "@common/entities/item/item.entity";
import { ItemGroupEntity } from "@common/entities/item/items/group.entity";
import { ItemPipeFittingEntity } from "@common/entities/item/items/pipe-fitting.entity";
import { AttributeName } from "@common/interfaces/attribute.interface";
import Papa from "papaparse";
import { firstValueFrom } from "rxjs";
import { Settings } from "src/app/interfaces/settings.interface";
import { convertToUnderscore } from "src/app/utils/string.util";
import * as SettingsSelectors from "src/app/store/selectors/settings.selector";
import * as LocalDataStorageSelectors from "src/app/store/selectors/local-data-storage.selector";
import * as LocalDataStorageActions from "src/app/store/actions/local-data-storage.action";
import { ItemService } from "../item/item.service";
import { Store } from "@ngrx/store";
import { SuggestionService } from "../suggestion/suggestion.service";
import { CSVColumnConfig } from "./interfaces/csv-column-config.interface";
import { addCSVItemsToGroup, getImportColumnConfigs, getRequiredImportColumnConfigs, parseNumberValue, validateCSVResult } from "./helper/import.helper";
import { generateCSVHeader, generateCSVRows, generateExportItems, getExportColumnConfigs } from "./helper/export.helper";
import { ConfirmationService, MessageService } from "primeng/api";
import { I18NextPipe } from "angular-i18next";
import { GroupService } from "../group/group.service";
import { ProgressIndicatorService } from "../progress-indicator/progress-indicator.service";
import { DataMigrationService } from "../data-migration/data-migration.service";

@Injectable({
  providedIn: 'root'
})
export class ImportExportService {

  private csvColumnConfig: CSVColumnConfig[] = [{
    name: "Gruppe",
    export: {
      enabled: true,
      transform: async (_, path) => path
    }
  }, {
    name: "Menge",
    export: {
      enabled: true,
      transform: (item) => item?.quantity?.toLocaleString("de-DE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: false
      }) ?? ""
    },
    import: {
      enabled: true,
      required: true,
      targetKey: "quantity",
      transform: (_, value) => parseNumberValue(value)
    }
  }, {
    name: "Engify ID",
    export: {
      enabled: true,
      transform: (item) => item?.typeId ?? ""
    },
    import: {
      enabled: true,
      required: true,
      targetKey: "typeId",
      transform: (_, value) => value?.toString()
    }
  }, {
    name: "Bauteil Name",
    export: {
      enabled: true,
      transform: async (item) => {
        const suggestions = await this.suggestionService.getColumnSuggestions(new ItemPipeFittingEntity({
          category: item.category
        }), 'typeId', true);

        const suggestion = suggestions.find(suggestion => suggestion.value === item.typeId);
        return suggestion?.label || "Unbekannt";
      }
    }
  }, {
    name: "Standard",
    export: {
      enabled: true,
      transform: (item) => item?.getAttribute(AttributeName.STANDARD) as string || ""
    }
  }, {
    name: "Werkstoff",
    export: {
      enabled: true,
      transform: (item) => item?.material || "",
    },
    import: {
      enabled: true,
      required: false,
      targetKey: "material",
      transform: (_, value, item) => value
    }
  }, {
    name: "DN1",
    export: {
      enabled: true,
      transform: (item) => item?.dn1 ? DIAMETER_NOMINAL_LABELS[item.dn1] : "",
    },
    import: {
      enabled: true,
      required: false,
      targetKey: "dn1",
      transform: (_, value) => {
        let d = null;
        if (typeof value === "string" && value.includes("x")) {
          const [dn1, _] = value.split("x");
          d = parseNumberValue(dn1) ?? null;
        } else {
          d = parseNumberValue(value) ?? null;
        }
        if (!d) {
          return null
        }
        return parseFloat(Object.entries(DIAMETER_NOMINAL_LABELS).find(([_, label]) => label === d.toString())?.[0] ?? "") || null;
      }
    }
  }, {
    name: "D1",
    export: {
      enabled: true,
      transform: (item) => item?.dn1?.toLocaleString("de-DE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: false
      }) ?? ""
    }
  }, {
    name: "S1",
    export: {
      enabled: true,
      transform: (item) => item?.s1?.toLocaleString("de-DE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: false
      }) ?? ""
    },
    import: {
      enabled: true,
      required: false,
      targetKey: "s1",
      transform: (_, value) => parseNumberValue(value) || null
    }
  }, {
    name: "DN2",
    export: {
      enabled: true,
      transform: (item) => item?.dn2 ? DIAMETER_NOMINAL_LABELS[item.dn2] : ""
    },
    import: {
      enabled: true,
      required: false,
      targetKey: "dn2",
      transform: (_field, value, _item, row) => {
        let d = null;
        if (typeof value !== "number" && typeof value !== "string") {
          const dn = row["DN1"];
          if (dn && typeof dn === "string" && dn.includes("x")) {
            const [_, dn2] = dn.split("x");
            d = parseNumberValue(dn2) ?? null;
          } else {
            d = parseNumberValue(value) ?? null;
          }
        } else {
          d = parseNumberValue(value) ?? null;
        }

        if (!d) {
          return null;
        }

        return parseFloat(Object.entries(DIAMETER_NOMINAL_LABELS).find(([_, label]) => label === d.toString())?.[0] ?? "") || null;
      }
    }
  }, {
    name: "D2",
    export: {
      enabled: true,
      transform: (item) => item?.dn2?.toLocaleString("de-DE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: false
      }) ?? ""
    }
  }, {
    name: "S2",
    export: {
      enabled: true,
      transform: (item) => item?.s2?.toLocaleString("de-DE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: false
      }) ?? ""
    },
    import: {
      enabled: true,
      required: false,
      targetKey: "s2",
      transform: (_, value) => parseNumberValue(value) || null
    }
  }, {
    name: "Gewicht",
    export: {
      enabled: true,
      transform: (item) => (item?.getAttribute(AttributeName.WEIGHT) as number)?.toLocaleString("de-DE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: false
      }) ?? ""
    }
  }, {
    name: "Materialpreis",
    export: {
      enabled: true,
      transform: (item) => (item?.getAttribute(AttributeName.PRICE_MATERIAL) as number)?.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false
      }) ?? ""
    }
  }, {
    name: "Fertigungspreis",
    export: {
      enabled: () => !!this.settings?.calculation.seperateManufacturingAssembly,
      transform: (item) => (item?.getAttribute(AttributeName.PRICE_MANUFACTURING) as number)?.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false
      }) ?? "",
    }
  }, {
    name: "Montagespreis",
    export: {
      enabled: () => !!this.settings?.calculation.seperateManufacturingAssembly,
      transform: (item) => (item?.getAttribute(AttributeName.PRICE_ASSEMBLY) as number)?.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false
      }) ?? "",
    }
  }, {
    name: "Montage & Fertigungspreis",
    export: {
      enabled: () => !this.settings?.calculation.seperateManufacturingAssembly,
      transform: (item) => (item?.getAttribute(AttributeName.PRICE_EFFORD) as number)?.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false
      }) ?? "",
    }
  }, {
    name: "Gesamtpreis",
    export: {
      enabled: true,
      transform: (item) => (item?.getAttribute(AttributeName.PRICE_TOTAL) as number)?.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false
      }) ?? ""
    }
  }];

  private settings: Settings | undefined;

/**
 * Creates an instance of ImportExportService.
 * 
 * @param store - The store instance used for state management.
 * @param itemService - Service to manage item-related operations.
 * @param suggestionService - Service to provide suggestion functionalities.
 * @param messageService - Service for displaying messages to the user.
 * @param groupService - Service for managing groups.
 * @param i18NextPipe - Pipe for internationalization and translation.
 * @param progressIndicatorService - Service to handle progress indication.
 * @param migrationService - Service to manage data migrations.
 * @param confirmationService - Service to handle user confirmations.
 */

  constructor(
    private store: Store,
    private itemService: ItemService,
    private suggestionService: SuggestionService,
    private messageService: MessageService,
    private groupService: GroupService,
    private i18NextPipe: I18NextPipe,
    private progressIndicatorService: ProgressIndicatorService,
    private migrationService: DataMigrationService,
    private confirmationService: ConfirmationService
  ) {
    this.store.select(SettingsSelectors.selectApplied).subscribe(settings => this.settings = settings);
  }

  /**
   * Imports JSON data into the application.
   * 
   * @param data - The JSON data to import.
   * @returns A Promise that resolves when the import is complete.
   * 
   * @remarks This function first checks if the settings are loaded. If not, it logs an error and returns.
   * It then shows a confirmation dialog to the user. If the user confirms, it tries to parse the JSON data.
   * If the data requires migration, it migrates the data and loads it into the application.
   * If the data does not require migration, it clears the root group and loads the parsed data into the application.
   * If any errors occur during the import process, it logs an error and displays a message to the user.
   */
  public async importJSONString(data: string): Promise<void> {
    if (!this.settings) {
      console.error("Error importing JSON Data: Settings not loaded");
      return;
    }

    const confirm = await new Promise((resolve) => 
      this.confirmationService.confirm({
        header: this.i18NextPipe.transform(`services.import-export.dialog.override.title`),
        message: this.i18NextPipe.transform(`services.import-export.dialog.override.message`),
        acceptLabel: this.i18NextPipe.transform(`services.import-export.dialog.override.button.confirm`),
        rejectLabel: this.i18NextPipe.transform(`services.import-export.dialog.override.button.cancel`),
        acceptButtonStyleClass: "p-button-primary",
        rejectButtonStyleClass: "p-button-secondary",
        icon: "pi pi-info-circle",
        accept: () => resolve(true),
        reject: () => resolve(false)
      })
    );

    if (!confirm) {
      return;
    }

    try {
      const parsedData = JSON.parse(data);

      if (this.migrationService.isMigrationNeededForData(parsedData)) {
        const migratedItem = this.migrationService.getMigratedItemForData(parsedData);
        if (migratedItem) {
          this.itemService.clearRootGroup();
          this.store.dispatch(LocalDataStorageActions.loadFromData({ data: migratedItem }));
          return;
        }
        this.messageService.add({ severity: 'error', summary: this.i18NextPipe.transform('error:import.failed.title'), detail: this.i18NextPipe.transform('error:import.failed.message') });
        return;
      }

      this.itemService.clearRootGroup();
      this.store.dispatch(LocalDataStorageActions.loadFromData({ data: parsedData }));
    } catch (error) {
      console.error("Error parsing JSON Data:", error);
      this.messageService.add({ severity: 'error', summary: this.i18NextPipe.transform('error:import.failed.title'), detail: this.i18NextPipe.transform('error:import.failed.message') });
    }
  }

  /**
   * Exports the current application data as a JSON file.
   * 
   * @returns A Promise that resolves when the export is complete.
   * 
   * @remarks This function first checks if the settings are loaded. If not, it logs an error and returns.
   * It then activates the progress indicator.
   * It retrieves the current application data from the local data storage.
   * It generates a filename based on the project and version metadata.
   * It creates a new anchor element, sets its href attribute to the JSON string representation of the data,
   * and sets its download attribute to the generated filename.
   * It appends the anchor element to the document body, triggers a click event, and removes the anchor element.
   * Finally, it deactivates the progress indicator.
   */
  public async exportJSON(): Promise<void> {
    if (!this.settings) {
      console.error("Error exporting JSON Data: Settings not loaded");
      return;
    }

    this.progressIndicatorService.activate();
  
    const localDataStorage = await firstValueFrom(this.store.select(LocalDataStorageSelectors.selectLocalDataStorageState));
    const data = localDataStorage.data;
    
    const filename = convertToUnderscore(data.metadata.project, data.metadata.version) + ".json";
    var element = document.createElement("a");
    element.setAttribute("href", "data:text/json;charset=UTF-8," + encodeURIComponent(JSON.stringify(data)));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    this.progressIndicatorService.deactivate();
  }


  /**
   * Imports CSV data into the application.
   * 
   * @param data - The CSV data to import.
   * 
   * @remarks This function first checks if the settings are loaded. If not, it logs an error and returns.
   * It then activates the progress indicator.
   * It tries to parse the CSV data using PapaParse.
   * If the parsing is successful, it validates the CSV data and retrieves the required import column configurations.
   * It retrieves the root group and checks if the CSV data contains a group row.
   * If the CSV data contains a group row, it creates a new group for each group in the CSV data and adds the corresponding items to the respective groups.
   * If the CSV data does not contain a group row, it creates a new group and adds all the items to it.
   * It then fixes the columns of the root group and calculates the items of the root group.
   * If any errors occur during the import process, it logs an error and displays a message to the user.
   * Finally, it deactivates the progress indicator.
   */
  public importCSVString(data: string) {
    if (!this.settings) {
      console.error("Error importing CSV Data: Settings not loaded");
      return;
    }

    this.progressIndicatorService.activate();
    try {
      Papa.parse(data, {
        complete: async (result: Papa.ParseResult<any>) => {
          try {
            await validateCSVResult(result, await getRequiredImportColumnConfigs(this.csvColumnConfig));
            const importColumnConfigs = await getImportColumnConfigs(this.csvColumnConfig);

            const fields = result.meta.fields as string[];
            const data = result.data;

            const targetGroup = (await this.groupService.selectGroup(ItemCategory.GROUP)) as ItemGroupEntity | undefined;
            if (!targetGroup) {
              this.progressIndicatorService.deactivate();
              return;
            }

            const hasGroupRow = fields.includes("Gruppe");
            if (!hasGroupRow) {
              const importGroup = new ItemGroupEntity({
                name: 'Import',
                contains: ItemCategory.PIPEFITTING,
                items: []
              });

              await addCSVItemsToGroup(importGroup, data, importColumnConfigs);
              targetGroup.addItem(importGroup);
            } else {
              const importGroup = new ItemGroupEntity({
                name: 'Import',
                contains: ItemCategory.GROUP,
                items: []
              });

              for (const row of data) {
                const groupPath = row["Gruppe"];
                if (!groupPath) {
                  throw new Error("No group path found in CSV file");
                }

                const groupPathParts = (groupPath as string).split("/").map(part => part.trim());

                let currentGroup: ItemGroupEntity = importGroup;
                for (let groupPathPartIndex = 0; groupPathPartIndex < groupPathParts.length; groupPathPartIndex++) {
                  const groupPathPart = groupPathParts[groupPathPartIndex];
                  let childGroup = (currentGroup.getItems({ type: ItemGroupEntity }) as ItemGroupEntity[]).find(item => item.name === groupPathPart) as ItemGroupEntity | undefined;
                  if (!childGroup) {
                    childGroup = new ItemGroupEntity({
                      name: groupPathPart,
                      contains: groupPathParts.length - 1 === groupPathPartIndex ? ItemCategory.PIPEFITTING : ItemCategory.GROUP,
                      items: []
                    });
                    currentGroup.addItem(childGroup);
                  }
                  currentGroup = childGroup;
                }

                if (currentGroup === targetGroup) {
                  throw new Error("Error finding group in CSV file");
                }
                await addCSVItemsToGroup(currentGroup, [row], importColumnConfigs);
              }

              for (const item of importGroup.items) {
                targetGroup.addItem(item);
              }
            }

            await this.itemService.fixColumnsOfGroup(targetGroup);
            this.itemService.calculateGroupItems(targetGroup);
            this.progressIndicatorService.deactivate();
          } catch (error) {
            console.error("Error importing CSV Data:", error);
            this.messageService.add({ severity: 'error', summary: this.i18NextPipe.transform('error:import.failed.title'), detail: this.i18NextPipe.transform('error:import.failed.message') });
            this.progressIndicatorService.deactivate();
          }
        },
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        error: (error: any) => {
          console.error("Error parsing CSV file:", error);
          this.messageService.add({ severity: 'error', summary: this.i18NextPipe.transform('error:import.failed.title'), detail: this.i18NextPipe.transform('error:import.failed.message') });
          this.progressIndicatorService.deactivate();
        }

      });
    } catch (error) {
      this.messageService.add({ severity: 'error', summary: this.i18NextPipe.transform('error:import.failed.title'), detail: this.i18NextPipe.transform('error:import.failed.message') });
      console.error("Error reading CSV file:", error);
      this.progressIndicatorService.deactivate();
    }
  }

  /**
   * Exports the current application data as a CSV file.
   * 
   * @returns A Promise that resolves when the export is complete.
   * 
   * @remarks This function first checks if the settings are loaded. If not, it logs an error and returns.
   * It then activates the progress indicator.
   * It retrieves the current application data from the local data storage.
   * It generates a filename based on the project and version metadata.
   * It creates export items from the root group.
   * It retrieves the export column configurations.
   * It generates the CSV header and rows.
   * It creates a new anchor element, sets its href attribute to the CSV string representation of the data,
   * and sets its download attribute to the generated filename.
   * It appends the anchor element to the document body, triggers a click event, and removes the anchor element.
   * Finally, it deactivates the progress indicator.
   */
  public async exportCSV(): Promise<void> {
    if (!this.settings) {
      console.error("Error importing CSV Data: Settings not loaded");
      return;
    }

    this.progressIndicatorService.activate();
    const localDataStorage = await firstValueFrom(this.store.select(LocalDataStorageSelectors.selectLocalDataStorageState));
    const data = localDataStorage.data;
    const rootGroup = this.itemService.rootGroup;

    if (!rootGroup) {
      this.progressIndicatorService.deactivate();
      return;
    }

    const filename = convertToUnderscore(data.metadata.project, data.metadata.version) + ".csv";

    const exportItems = generateExportItems(rootGroup);
    const columnConfigs = await getExportColumnConfigs(this.csvColumnConfig);

    const csvHeader = generateCSVHeader(columnConfigs);
    const csvRows = await generateCSVRows(columnConfigs, exportItems);

    const blob = new Blob([[csvHeader, csvRows].join('\n')], { type: "text/csv;charset=utf-8;" });
    const element = document.createElement("a");
    element.setAttribute("href", window.URL.createObjectURL(blob));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    this.progressIndicatorService.deactivate();
  }
}