import { Component } from '@angular/core';
import { I18NEXT_SCOPE, I18NextPipe } from 'angular-i18next';
import { ControlFormulaListComponent } from "../../controls/formula/list/control-formula-list.component";
import { ControlItemSpecificationListComponent } from "../../controls/custom-item/list/control-custom-item-list.component";
import { CustomItemMode } from 'src/app/interfaces/settings.interface';
import { ItemCategory } from '@common/entities/item/item.entity';

@Component({
  selector: "settings-section-custom-items",
  templateUrl: "./settings-section-custom-items.component.html",
  styleUrls: ["./settings-section-custom-items.component.scss"],
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
export class SettingsSectionCustomItemsComponent {
  protected mode = CustomItemMode.CUSTOM_ITEM;
  protected category = ItemCategory.PIPEFITTING;
}
