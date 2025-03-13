import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { I18NEXT_SCOPE, I18NEXT_SERVICE, ITranslationService, I18NextModule, I18NextPipe } from 'angular-i18next';
import { FormsModule } from '@angular/forms';
import { Settings } from 'src/app/interfaces/settings.interface';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import * as SettingsSelectors from '../../../../../store/selectors/settings.selector';
import * as SettingsActions from '../../../../../store/actions/settings.action';
import { Button } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { TooltipModule } from 'primeng/tooltip';
import { ControlLanguageComponent } from '../../controls/language/control-language.component';
import { PanelModule } from 'primeng/panel';
import { DEFAULT_LOGO } from 'src/app/consts/logo.const';
import { ConfirmationService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ControlCurrencyComponent } from '../../controls/currency/control-currency.component';
import { cloneDeep } from 'lodash';

@Component({
    selector: "settings-section-general",
    templateUrl: "./settings-section-general.component.html",
    styleUrls: ["./settings-section-general.component.scss"],
    providers: [{
      provide: I18NEXT_SCOPE,
      useValue: "components.controls.settings",
    }],
    standalone: true,
    imports: [
        PanelModule,
        ControlLanguageComponent,
        ControlCurrencyComponent,
        FormsModule,
        TooltipModule,
        ImageModule,
        Button,
        I18NextModule,
        InputNumberModule,
        InputTextModule
    ],
})
export class SettingsSectionGeneralComponent implements OnInit, OnDestroy {
  protected logoSrc = '/assets/images/engify-logo.png';
  protected language!: string;
  protected currency!: Settings['currency'];

  private settings!: Settings;
  private subscriptions = new Subscription();

  /**
   * Constructor.
   *
   * @param store The ngrx store to dispatch the change settings action.
   * @param confirmationService The confirmation service to show a confirmation dialog.
   * @param i18NextService The i18next service to change the language.
   * @param i18NextPipe The i18next pipe to translate the texts.
   */
  constructor(
    private store: Store,
    private confirmationService: ConfirmationService,
    @Inject(I18NEXT_SERVICE) private i18NextService: ITranslationService,
    private i18NextPipe: I18NextPipe
  ) {
  }

  /**
   * Initializes the component by setting the initial language and subscribing to the store for changes.
   *
   * @returns {void}
   */
  ngOnInit(): void {
    // Set the initial language based on the i18next service
    this.language = this.i18NextService.language;

    // Subscribe to the store to listen for changes in the temporary settings
    this.subscriptions.add(
      this.store.select(SettingsSelectors.selectTemporary).subscribe((settings) => {
        // Update the local settings and currency variables with the new values
        this.settings = settings;
        this.currency = cloneDeep(settings.currency);

        // If a logo is provided in the settings, use it; otherwise, use the default logo
        if (settings?.visual?.logo) {
          this.logoSrc = settings.visual.logo;
        } else {
          this.logoSrc = DEFAULT_LOGO;
        }
      })
    );
  }

  /**
   * Unsubscribes from all subscriptions when the component is destroyed.
   *
   * This method is called automatically by Angular when the component is destroyed.
   * It ensures that any ongoing subscriptions are properly cleaned up to prevent memory leaks.
   *
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Updates the current language setting and changes the i18next service language.
   *
   * @param language - The new language code to set.
   *
   * @returns {void} - This function does not return any value.
   */
  updateLanguage(language: string): void {
    this.language = language;
    this.i18NextService.changeLanguage(language);
  }

  /**
   * Handles the logo upload event and updates the settings with the new logo.
   *
   * @param event - The event object containing the file input's target.
   *
   * @returns {void} - This function does not return any value.
   */
  uploadLogo(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (file.size > 1024 * 1024) {
          this.confirmationService.confirm({
            target: event.target as EventTarget,
            header: this.i18NextPipe.transform("components.controls.settings.general.logo.dialog.upload-error.title"),
            message: this.i18NextPipe.transform("components.controls.settings.general.logo.dialog.upload-error.message"),
            acceptLabel: this.i18NextPipe.transform("components.controls.settings.general.logo.dialog.upload-error.button.accept"),
            acceptButtonStyleClass: "p-button-secondary",
            icon: "pi pi-exclamation-triangle",
            rejectVisible: false,
          });
          return;
        }

        this.store.dispatch(SettingsActions.update({
          settings: {
            ...this.settings,
            visual: {
              ...this.settings.visual,
              logo: reader.result as string
            }
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Removes the current logo from the settings by dispatching an update action with the logo set to null.
   *
   * @returns {void} - This function does not return any value.
   */
  removeLogo(): void {
    this.store.dispatch(SettingsActions.update({
      settings: {
        ...this.settings,
        visual: {
          ...this.settings.visual,
          logo: null
        }
      }
    }));
  }

  /**
   * Updates the currency settings in the application.
   *
   * This function dispatches an action to update the temporary settings in the store with the new currency settings.
   * It uses the spread operator to merge the existing currency settings with the provided currency object.
   *
   * @param currency - An object containing the new currency settings.
   * The object can contain any combination of the following properties: symbol, code, thousandsSeparator, decimalSeparator, and fractionDigits.
   *
   * @returns {void} - This function does not return any value.
   */
  updateCurrency(currency: Partial<Settings['currency']>): void {
    console.log(currency);
    this.store.dispatch(SettingsActions.update({
      settings: {
        ...this.settings,
        currency: {
          ...this.settings.currency,
          ...currency
        }
      }
    }));
  }
}
