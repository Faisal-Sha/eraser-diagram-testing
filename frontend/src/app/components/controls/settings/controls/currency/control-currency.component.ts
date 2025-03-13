import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { supportedLanguages } from '../../../../../config/i18n-config';
import { Settings } from 'src/app/interfaces/settings.interface';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { I18NEXT_SCOPE, I18NextModule } from 'angular-i18next';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
    selector: 'app-control-currency',
    templateUrl: './control-currency.component.html',
    styleUrls: ['./control-currency.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ControlCurrencyComponent),
            multi: true
        }, {
          provide: I18NEXT_SCOPE,
          useValue: 'components.controls.settings.controls.currency'
        }
    ],
    standalone: true,
    imports: [
      I18NextModule,
      FormsModule,
      FloatLabelModule,
      InputTextModule,
      InputNumberModule
    ]
})
export class ControlCurrencyComponent implements ControlValueAccessor {
  protected supportedLanguages = supportedLanguages;
  protected languageOptions = Object.keys(supportedLanguages);
  protected _currency!: Settings['currency'];
  protected disabled = false;

  /**
   * The currency to be used for the given settings.
   * @param currency The currency information as described in {@link Settings}.
   */
  set currency(currency: Settings['currency']) {
    this._currency = currency
  }

  /**
   * Gets the currency information currently set.
   * @returns The currency information as described in {@link Settings}.
   */
  get currency(): Settings['currency'] {
    return this._currency;
  }

  protected onChange: any = () => { };
  protected onTouched: any = () => { };

  constructor() { }

  /**
   * Writes a new value to the element.
   *
   * This method is called by the Angular forms API when the model value changes.
   * It updates the internal currency property with the new value.
   *
   * @param currency - The new currency value to be written to the element.
   * The currency value should conform to the {@link Settings.currency} interface.
   *
   * @returns {void}
   */
  writeValue(currency: Settings['currency']): void {
    this.currency = currency;
  }

  /**
   * Registers a function to be called when the model value changes.
   *
   * This method is called by the Angular forms API when the model value changes.
   * It updates the internal `onChange` function to the provided function.
   *
   * @param fn - A function to be called when the model value changes.
   * The function takes a single parameter:
   * - `currency` (Settings['currency']): The new currency value.
   *
   * @returns {void}
   */
  registerOnChange(fn: (currency: Settings['currency']) => void): void {
    this.onChange = fn;
  }

  /**
   * Registers a function to be called when the control is touched.
   *
   * This method is called by the Angular forms API when the control is touched.
   * It updates the internal `onTouched` function to the provided function.
   *
   * @param fn - A function to be called when the control is touched.
   *
   * @returns {void}
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Sets the disabled state of the currency control.
   *
   * This method is called by the Angular forms API when the control status changes.
   * It updates the internal `disabled` property of the component to reflect the new state.
   *
   * @param isDisabled - A boolean value indicating whether the control should be disabled.
   *
   * @returns {void}
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Emits the current currency value to the form control.
   * This method is called when the currency value changes and when the component is touched.
   * It updates the value of the form control using the provided change and touch functions.
   *
   * @returns {void}
   */
  emitChange(): void {
    this.onChange(this.currency);
    this.onTouched(this.currency);
  }
}
