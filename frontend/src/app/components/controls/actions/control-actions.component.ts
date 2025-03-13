import { QuickfillService } from "./../../../services/quickfill/quickfill.service";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { I18NEXT_SCOPE, I18NextModule, I18NextPipe } from "angular-i18next";
import { ConfirmationService, MenuItem, PrimeTemplate } from "primeng/api";
import { Subscription } from "rxjs";
import { ItemService } from "../../../services/item/item.service";
import { DialogService } from 'primeng/dynamicdialog';
import { GroupService } from '../../../services/group/group.service';
import { SettingsService } from "src/app/services/settings/settings.service";
import { TooltipModule } from "primeng/tooltip";
import { Button } from "primeng/button";
import { MenuModule } from "primeng/menu";
import { Store } from "@ngrx/store";
import { SuggestionService } from "src/app/services/suggestion/suggestion.service";
import { ImportExportService } from "src/app/services/import-export/import-export.service";
import { UnitPriceService } from "src/app/services/unit-price/unit-price.service";


interface ServiceContainers {
  suggestionService: SuggestionService;
}

@Component({
    selector: "app-control-actions",
    templateUrl: "./control-actions.component.html",
    styleUrls: ["./control-actions.component.scss"],
    providers: [{
      provide: I18NEXT_SCOPE,
      useValue: "components.controls.actions",
    }],
    standalone: true,
    imports: [
        MenuModule,
        PrimeTemplate,
        Button,
        TooltipModule,
        I18NextModule,
    ],
})
export class ControlActionsComponent {
  @ViewChild("jsonFileInput", { static: false }) jsonFileInput!: ElementRef;
  @ViewChild("csvFileInput", { static: false }) csvFileInput!: ElementRef;

  protected medadataChangeSubscription!: Subscription;

  protected serviceContainers: ServiceContainers;

  protected exportMenuItems = [
    {
      label: this.i18NextPipe.transform("menu.export.title"),
      items: [
        {
          label: this.i18NextPipe.transform("menu.export.csv"),
          command: () => this.importExportService.exportCSV()
        },
        {
          label: this.i18NextPipe.transform(
            "menu.export.json"
          ),
          command: () => this.importExportService.exportJSON()
        },
      ],
    },
  ];

  protected importMenuItems = [{
    label: this.i18NextPipe.transform("menu.import.title"),
    items: [{
      label: this.i18NextPipe.transform("menu.import.csv"),
      command: () => this.csvFileInput.nativeElement.click()
    }, {
      label: this.i18NextPipe.transform("menu.import.json"),
      command: () => this.jsonFileInput.nativeElement.click()
    }]
  }];

  protected printMenuItems = [{
    label: this.i18NextPipe.transform("menu.print.title"),
    items: [{
      label: this.i18NextPipe.transform("menu.print.with-prices"),
      command: () => 
        this.router.navigate(["/print"])
    }, {
      label: this.i18NextPipe.transform("menu.print.without-prices"),
      command: () => 
        this.router.navigate(["/print"], { queryParams: { hidePrices: true } })
    }]
  }];

  protected newItems: MenuItem[] = [
    {
      label: this.i18NextPipe.transform("menu.add.group.title"),
      items: [
        {
          label: this.i18NextPipe.transform("menu.add.group.general"),
          icon: 'pi pi-plus',
          command: () => this.groupService.addGroupTypeGroup()
        },
        {
          label: this.i18NextPipe.transform("menu.add.group.pipefittings"),
          icon: 'pi pi-plus',
          command: () => this.groupService.addGroupTypePipeFitting()
        },
        // {
        //   label: this.i18NextPipe.transform("menu.add.group.services"),
        //   icon: 'pi pi-plus',
        //   command: () => this.groupService.addGroupTypeService()
        // }
      ]
    }
  ];

  /**
   * @param router The router to navigate to the print page
   * @param confirmationService The confirmation service to show a confirmation dialog
   * @param i18NextPipe The i18next pipe to translate the menu items
   * @param itemService The item service to get the items for the export
   * @param quickfillService The quickfill service to get the quickfill items for the export
   * @param dialogService The dialog service to show the import dialog
   * @param groupService The group service to add a new group
   * @param settingsService The settings service to get the settings for the export
   * @param suggestionService The suggestion service to get the suggestions for the import
   * @param importExportService The import export service to import and export the items
   * @param store The store to get the items for the export
   * @param unitPriceService The unit price service to get the unit prices for the export
   */
  constructor(
    private router: Router,
    private confirmationService: ConfirmationService,
    private i18NextPipe: I18NextPipe,
    protected itemService: ItemService,
    protected quickfillService: QuickfillService,
    protected dialogService: DialogService,
    protected groupService: GroupService,
    protected settingsService: SettingsService,
    protected suggestionService: SuggestionService,
    private importExportService: ImportExportService,
    protected store: Store,
    protected unitPriceService: UnitPriceService
  ) {
    this.serviceContainers = {
      suggestionService: this.suggestionService
    };
  }

  /**
   * Handles the confirmation for resetting the application data.
   *
   * @param event - The event that triggered the confirmation dialog.
   *
   * @remarks
   * This function uses the `confirmationService` to show a confirmation dialog with customizable options.
   * The dialog includes a header, message, accept and reject labels, button classes, and an icon.
   * When the user accepts the reset, it calls the `itemService.reset()` method.
   *
   * @returns {void}
   */
  protected confirmReset(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      header: this.i18NextPipe.transform("confirmation.reset.title"),
      message: this.i18NextPipe.transform("confirmation.reset.message"),
      acceptLabel: this.i18NextPipe.transform("confirmation.reset.accept"),
      rejectLabel: this.i18NextPipe.transform("confirmation.reset.reject"),
      acceptButtonStyleClass: "p-button-danger",
      rejectButtonStyleClass: "p-button-secondary",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        this.itemService.reset();
      },
      reject: () => {},
    });
  }

  /**
   * Handles the file parsing and import process when a file is selected.
   *
   * @param event - The event that triggered the file selection.
   *
   * @remarks
   * This function reads the selected file, determines its type (JSON or CSV),
   * and calls the appropriate import method from the `importExportService` based on the file type.
   * If the file type is unsupported, it logs an error message to the console.
   *
   * @returns {void}
   */
  protected parseFile(event: any): void {
    const files = event.target.files;

    if (files && files.length > 0) {
      const file = files[0];
      let fileReader = new FileReader();

      fileReader.onload = () => {
        const data = fileReader.result as string;
        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

        if (fileExtension === "json") {
          event.target.value = "";
          this.importExportService.importJSONString(data);
        } else if (fileExtension === "csv") {
          event.target.value = "";
          this.importExportService.importCSVString(data);
        } else {
          event.target.value = "";
          console.error("Unsupported file type");
        }
      };

      fileReader.readAsText(file);
    } else {
      console.error("No file selected.");
    }
  }
}
