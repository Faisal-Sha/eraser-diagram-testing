import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { I18NEXT_SCOPE, I18NextModule } from "angular-i18next";
import { ItemService } from "../../../services/item/item.service";
import { DEFAULT_LOGO } from "../../../consts/logo.const";
import { ItemEntity } from "@common/entities/item/item.entity";
import { ItemGroupEntity } from "@common/entities/item/items/group.entity";
import { ItemCategory } from "@common/entities/item/item.entity";
import { isItemPrintColumn, ItemColumn, ItemStructure } from "@common/interfaces/items/item-structure.interface";
import itemStructureResolver from "@common/entities/item/resolvers/item-structure";
import {
  ITEM_CATEGORY_TO_ICON,
} from "@common/entities/item/resolvers/item.resolver";
import {
  SuggestionService,
} from "src/app/services/suggestion/suggestion.service";
import { ControlCalculationCellComponent } from "../../controls/calculation/cell/control-calculation-cell.component";
import { PrimeTemplate } from "primeng/api";
import { TableModule } from "primeng/table";
import { NgTemplateOutlet, CurrencyPipe, DatePipe, AsyncPipe, DecimalPipe, CommonModule } from "@angular/common";
import { Store } from "@ngrx/store";
import * as MetadataSelectors from "src/app/store/selectors/metadata.selector";
import * as SettingsSelectors from "src/app/store/selectors/settings.selector";
import { Observable } from "rxjs";
import { Metadata } from "src/app/interfaces/metadata.interface";
import { Settings } from "src/app/interfaces/settings.interface";
import { AttributeName } from "@common/interfaces/attribute.interface";
import { GetItemAttributePipe } from "src/app/pipes/get-item-attribute.pipe";

@Component({
    selector: "app-print",
    templateUrl: "./print.component.html",
    styleUrls: ["./print.component.scss"],
    providers: [{
      provide: I18NEXT_SCOPE,
      useValue: "components.print-page",
    }],
    standalone: true,
    imports: [
        NgTemplateOutlet,
        TableModule,
        PrimeTemplate,
        ControlCalculationCellComponent,
        CurrencyPipe,
        DatePipe,
        I18NextModule,
        AsyncPipe,
        DecimalPipe,
        GetItemAttributePipe,
        CommonModule
    ],
})
export class PrintPageComponent implements OnInit {
  protected readonly DEFAULT_LOGO = DEFAULT_LOGO;
  protected readonly ITEM_CATEGORY_TO_ICON = ITEM_CATEGORY_TO_ICON;

  protected ItemCategory = ItemCategory;
  protected AttributeName = AttributeName;

  protected metadata: Observable<Metadata>;
  protected settings: Observable<Settings> | null = null;
  protected hidePrices = false;

  private structureCache = new Map<ItemCategory, ItemStructure>();

  /**
   * Initializes the component.
   *
   * @param router The router.
   * @param activatedRoute The activated route.
   * @param itemService The item service.
   * @param suggestionService The suggestion service.
   * @param store The store.
   */
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    protected itemService: ItemService,
    protected suggestionService: SuggestionService,
    protected store: Store
  ) {
    this.metadata = this.store.select(MetadataSelectors.selectMetadata);
    this.settings = this.store.select(SettingsSelectors.selectApplied);

    this.activatedRoute.queryParams.subscribe((params) => {
      this.hidePrices = params['hidePrices'] === 'true';
    });
  }

  ngOnInit(): void {
  }

  /**
   * Initiates the printing process for the current page.
   *
   * This function uses the `setTimeout` function to delay the execution of the printing logic.
   * After a brief delay, it invokes the `window.print()` method to trigger the browser's print dialog.
   * After printing, it navigates the user back to the home page using the `router.navigate` method.
   *
   * @returns {void}
   */
  print() {
    setTimeout(() => {
      window.print();
      this.router.navigate(["/"]);
    }, 0);
  }

  /**
   * Handles the image load event for the print component.
   * When the image is fully loaded, it triggers the printing process.
   *
   * @returns {void}
   */
  onImageLoad() {
    this.print();
  }

  /**
   * Retrieves the item structure based on the given item category.
   * If the structure is already cached, it returns the cached version.
   * Otherwise, it resolves the structure using the `itemStructureResolver` function,
   * filters out the print columns if prices are hidden, and caches the result.
   *
   * @param itemCategory - The category of the item for which the structure is required.
   * @returns The resolved item structure.
   */
  protected getStructureByCategory(itemCategory: ItemCategory): ItemStructure {
    if (this.structureCache.has(itemCategory)) {
      return this.structureCache.get(itemCategory) as ItemStructure;
    }

    const structure = itemStructureResolver(itemCategory);
    if (!this.hidePrices) {
      structure.columns = structure.columns.filter(c => !isItemPrintColumn(c));
    }
    this.structureCache.set(itemCategory, structure);
    return structure;
  }

  /**
   * Generates a map of item IDs to boolean values indicating whether the corresponding item should be expanded.
   * This function is specifically designed for handling item groups, where it identifies and marks the IDs of
   * nested item groups for expansion.
   *
   * @param itemGroupEntity - The parent item group entity for which the expanded item keys are to be generated.
   * @returns A map of item IDs to boolean values, where the keys represent item IDs and the values indicate
   * whether the corresponding item should be expanded.
   */
  protected getExpandedItemKeys(itemGroupEntity: ItemEntity): {
    [key: string]: boolean;
  } {
    const expandedItemKeys: { [key: string]: boolean } = {};
    if (itemGroupEntity instanceof ItemGroupEntity) {
      itemGroupEntity.items.forEach((item) => {
        if (item instanceof ItemGroupEntity) {
          expandedItemKeys[item.id] = true;
        }
      });
    }
    return expandedItemKeys;
  }
}
