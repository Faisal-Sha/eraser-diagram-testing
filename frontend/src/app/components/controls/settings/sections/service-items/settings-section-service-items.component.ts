import { Component } from '@angular/core';
import { I18NEXT_SCOPE } from 'angular-i18next';
import { ControlItemSpecificationListComponent } from "../../controls/custom-item/list/control-custom-item-list.component";
import { CustomItemMode } from 'src/app/interfaces/settings.interface';
import { ItemCategory } from '@common/entities/item/item.entity';

@Component({
  selector: "settings-section-service-items",
  templateUrl: "./settings-section-service-items.component.html",
  styleUrls: ["./settings-section-service-items.component.scss"],
  providers: [
    {
      provide: I18NEXT_SCOPE,
      useValue: "component.controls.settings",
    },
  ],
  standalone: true,
  imports: [
    ControlItemSpecificationListComponent
],
})
export class SettingsSectionServiceItemsComponent {
  protected mode = CustomItemMode.CUSTOM_ITEM;
  protected category = ItemCategory.SERVICE;
}
