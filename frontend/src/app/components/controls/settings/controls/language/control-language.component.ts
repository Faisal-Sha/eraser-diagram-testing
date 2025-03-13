import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { supportedLanguages } from '../../../../../config/i18n-config';
import { DropdownModule } from 'primeng/dropdown';

@Component({
    selector: 'app-control-language',
    templateUrl: './control-language.component.html',
    styleUrls: ['./control-language.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ControlLanguageComponent),
            multi: true
        }
    ],
    standalone: true,
    imports: [DropdownModule, FormsModule]
})
export class ControlLanguageComponent implements ControlValueAccessor {
  protected supportedLanguages = supportedLanguages;
  protected languageOptions = Object.keys(supportedLanguages);
  protected _selectedLanguage!: string;
  protected disabled = false;

  /**
   * The currently selected language.
   * Setting this will trigger the onChange callback.
   */
  set selectedLanguage(language: string) {
    this._selectedLanguage = language
    this.onChange(language);
    this.onTouched(language);
  }

/**
 * Retrieves the currently selected language.
 * 
 * @returns The selected language as a string.
 */

  get selectedLanguage(): string {
    return this._selectedLanguage;
  }

  protected onChange: any = () => { };
  protected onTouched: any = () => { };

  constructor() { }

  /**
   * Writes a new value to the element.
   *
   * This method is called by the forms API when the control's value changes.
   * It should update the view with the new value.
   *
   * @param language - The new value to be written to the element.
   * This value is typically a string, but can be any type depending on the control's requirements.
   *
   * @returns void - This method does not return a value.
   */
  writeValue(language: any): void {
    this.selectedLanguage = language;
  }

  /**
   * Registers a function to be called when the control's value changes.
   *
   * This method is called by the forms API when the control's value changes.
   * It should update the internal state of the control to reflect the new value.
   *
   * @param fn - The function to be called when the control's value changes.
   * This function takes a single parameter, which is the new value of the control.
   *
   * @returns void - This method does not return a value.
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * Registers a function to be called when the control is touched.
   *
   * This method is called by the forms API when the control is touched.
   * It should update the internal state of the control to reflect that it has been touched.
   *
   * @param fn - The function to be called when the control is touched.
   * This function takes no parameters.
   *
   * @returns void - This method does not return a value.
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Sets the disabled state of the control.
   *
   * This method is called by the forms API when the control status changes to or from 'DISABLED'.
   * It should update the internal state of the control to reflect the new disabled state.
   *
   * @param isDisabled - A boolean value indicating whether the control should be disabled.
   * When `true`, the control should be disabled and not allow user interaction.
   * When `false`, the control should be enabled and allow user interaction.
   *
   * @returns void - This method does not return a value.
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
