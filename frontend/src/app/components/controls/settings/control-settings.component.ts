import { Component } from '@angular/core';
import { I18NEXT_SCOPE, I18NextModule } from 'angular-i18next';
import { SettingsSectionFormulasComponent } from "./sections/formulas/settings-section-formulas.component";
import { SettingsSectionGeneralComponent } from "./sections/general/settings-section-general.component";
import { NgComponentOutlet } from '@angular/common';
import { SettingsSectionHourlyRatesComponent } from './sections/hourly-rates/settings-section-hourly-rates.component';
import { SettingsSectionCustomItemsComponent } from './sections/custom-items/settings-section-custom-items.component';
import { SettingsSectionOverrideItemsComponent } from './sections/override-items/settings-section-override-items.component';
import { SettingsSectionServiceItemsComponent } from './sections/service-items/settings-section-service-items.component';

@Component({
  selector: "app-control-settings",
  templateUrl: "./control-settings.component.html",
  styleUrls: ["./control-settings.component.scss"],
  providers: [{
    provide: I18NEXT_SCOPE,
    useValue: "components.controls.settings",
  }],
  standalone: true,
  imports: [
    I18NextModule,
    NgComponentOutlet,
    SettingsSectionFormulasComponent,
    SettingsSectionGeneralComponent,
    SettingsSectionCustomItemsComponent,
    SettingsSectionOverrideItemsComponent,
    SettingsSectionServiceItemsComponent
  ],
})
export class ControlSettingsComponent {

  protected activeTab = 0;
  protected tabs = [
    {
      i18nLabel: "tabs.general",
      component: SettingsSectionGeneralComponent,
    },
    {
      i18nLabel: "tabs.calculation",
      component: SettingsSectionHourlyRatesComponent,
    },
    {
      i18nLabel: "tabs.override-items",
      component: SettingsSectionOverrideItemsComponent,
    },
    {
      i18nLabel: "tabs.add-items",
      component: SettingsSectionCustomItemsComponent,
    },
    // {
    //   i18nLabel: "tabs.service-items",
    //   component: SettingsSectionServiceItemsComponent,
    // },
    {
      i18nLabel: "tabs.formulas",
      component: SettingsSectionFormulasComponent,
    }
  ];

  /**
   * Handles the activation of a tab in the settings component.
   *
   * @param $event - The mouse event that triggered the tab activation.
   * @param index - The index of the tab to be activated.
   *
   * @returns {void} - This function does not return any value.
   */
  protected activateTab($event: MouseEvent, index: number): void {
    $event.preventDefault();
    $event.stopPropagation();

    this.activeTab = index;
  }
}
