import { Component } from '@angular/core';
import { I18NEXT_SCOPE } from 'angular-i18next';
import { ControlFormulaListComponent } from "../../controls/formula/list/control-formula-list.component";

@Component({
  selector: "settings-section-formulas",
  templateUrl: "./settings-section-formulas.component.html",
  styleUrls: ["./settings-section-formulas.component.scss"],
  providers: [
    {
      provide: I18NEXT_SCOPE,
      useValue: "component.controls.settings",
    },
  ],
  standalone: true,
  imports: [
    ControlFormulaListComponent
  ],
})
export class SettingsSectionFormulasComponent {
}
