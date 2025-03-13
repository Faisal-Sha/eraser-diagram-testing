import { Component } from '@angular/core';
import { I18NEXT_SCOPE } from 'angular-i18next';
import { ControlFormulaListComponent } from "../../controls/formula/list/control-formula-list.component";
import { ControlItemSpecificationListComponent } from "../../controls/custom-item/list/control-custom-item-list.component";
import { CustomItemMode } from 'src/app/interfaces/settings.interface';
import { ItemCategory } from '@common/entities/item/item.entity';

@Component({
  selector: "settings-section-override-items",
  templateUrl: "./settings-section-override-items.component.html",
  styleUrls: ["./settings-section-override-items.component.scss"],
  providers: [
    {
      provide: I18NEXT_SCOPE,
      useValue: "component.controls.settings",
    },
  ],
  standalone: true,
  imports: [
    ControlFormulaListComponent,
    ControlItemSpecificationListComponent
],
})
export class SettingsSectionOverrideItemsComponent {
  protected mode = CustomItemMode.OVERRIDE_ITEM;
  protected category = ItemCategory.PIPEFITTING;
}
