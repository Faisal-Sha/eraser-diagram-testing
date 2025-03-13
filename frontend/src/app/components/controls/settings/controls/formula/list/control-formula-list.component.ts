import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { I18NEXT_SCOPE, I18NextModule, I18NextPipe } from 'angular-i18next';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { FormulaService } from 'src/app/services/formula/formula.service';
import * as SettingsSelectors from 'src/app/store/selectors/settings.selector';
import * as SettingsActions from 'src/app/store/actions/settings.action';
import { Formula } from 'src/app/interfaces/formula.interface';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { ConfirmationService } from 'primeng/api';
import { firstValueFrom, map } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'settings-control-formula-list',
    templateUrl: './control-formula-list.component.html',
    styleUrls: ['./control-formula-list.component.scss'],
    providers: [{
      provide: I18NEXT_SCOPE,
      useValue: 'components.controls.settings.controls.formula-list'
    }],
    standalone: true,
    imports: [
      I18NextModule,
      TableModule,
      ButtonModule,
      TooltipModule,
      InputSwitchModule,
      FormsModule,
      AsyncPipe
    ]
})
export class ControlFormulaListComponent {
  private settings$ = this.store.select(SettingsSelectors.selectTemporary);
  protected formulas$ = this.settings$.pipe(map(settings => settings.formulas));

/**
 * Constructs a new ControlFormulaListComponent instance.
 * 
 * @param store - NgRx store for state management.
 * @param formulaService - Service for handling formulas.
 * @param i18NextPipe - Pipe for internationalization.
 * @param confirmationService - Service for managing confirmations.
 */
  constructor(
    private store: Store,
    protected formulaService: FormulaService,
    private i18NextPipe: I18NextPipe,
    protected confirmationService: ConfirmationService
  ) { }

  /**
   * Duplicates the given formula and adds it to the list of formulas in the settings.
   * The new formula's name is updated to ensure uniqueness.
   *
   * @param formula - The formula to be duplicated.
   * @returns A promise that resolves when the duplication is complete.
   */
  protected async duplicate(formula: Formula): Promise<void> {
    const formulas = [...await firstValueFrom(this.formulas$)];

    const newFormula = cloneDeep(formula);
    newFormula.id = uuidv4();

    newFormula.name = this.i18NextPipe.transform('components.controls.settings.controls.formula-list.duplicate-name', { name: formula.name });

    let duplicateCounter = 1;
    let name = newFormula.name;
    while (formulas.some(formula => formula.name === name)) {
      name = newFormula.name + ` (${duplicateCounter})`;
      duplicateCounter++;
    }
    newFormula.name = name;

    const index = formulas.findIndex((f) => f.id === formula.id);
    formulas.splice(index + 1, 0, newFormula);

    const settings = await firstValueFrom(this.settings$);
    this.store.dispatch(SettingsActions.update({ settings: { ...settings, formulas } }));
  }

  /**
   * Removes the given formula from the list of formulas in the settings.
   *
   * @param formula - The formula to be removed.
   * @returns A promise that resolves when the removal is complete.
   */
  protected async remove(formula: Formula): Promise<void> {
    // Retrieve the current list of formulas from the store
    const formulas = (await firstValueFrom(this.formulas$)).filter((f) => f.id !== formula.id);

    // Retrieve the current settings from the store
    const settings = await firstValueFrom(this.settings$);

    // Update the settings by removing the given formula
    this.store.dispatch(SettingsActions.update({ settings: { ...settings, formulas } }));
  }

  /**
   * Toggles the 'active' status of the given formula in the settings.
   *
   * @param formula - The formula for which the 'active' status needs to be toggled.
   * @returns A promise that resolves when the 'active' status toggle is complete.
   */
  protected async toggleActive(formula: Formula): Promise<void> {
    // Retrieve the current list of formulas from the store
    const formulas = (await firstValueFrom(this.formulas$)).map((f) => {
      if (f.id === formula.id) {
        // Toggle the 'active' status of the given formula
        return { ...f, active: !f.active };
      }
      return f;
    });

    // Retrieve the current settings from the store
    const settings = await firstValueFrom(this.settings$);

    // Update the settings by toggling the 'active' status of the given formula
    this.store.dispatch(SettingsActions.update({ settings: { ...settings, formulas } }));
  }

  /**
   * Opens a confirmation dialog to remove the given formula from the list.
   *
   * @param event - The event that triggered the confirmation dialog.
   * @param formula - The formula to be removed.
   *
   * @returns {void}
   */
  protected confirmRemoveFormula(event: Event, formula: Formula): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      header: this.i18NextPipe.transform("components.controls.settings.controls.formula-list.confirmation.remove.title"),
      message: this.i18NextPipe.transform("components.controls.settings.controls.formula-list.confirmation.remove.message"),
      acceptLabel: this.i18NextPipe.transform("components.controls.settings.controls.formula-list.confirmation.remove.accept"),
      rejectLabel: this.i18NextPipe.transform("components.controls.settings.controls.formula-list.confirmation.remove.reject"),
      acceptButtonStyleClass: "p-button-danger",
      rejectButtonStyleClass: "p-button-secondary",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        this.remove(formula);
      },
      reject: () => {},
    });
  }
}


