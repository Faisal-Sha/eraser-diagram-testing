import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';


@Injectable({
  providedIn: 'root'
})
export class FormService {
  constructor() { }

  /**
   * Validates a form control and its children recursively.
   *
   * @param control - The AbstractControl to validate. This can be a FormControl, FormGroup, or FormArray.
   *
   * @returns {void} This function does not return a value.
   *
   * @remarks
   * This function is used to mark all form controls as touched and update their validity.
   * It recursively validates child controls within a FormGroup or FormArray.
   *
   * @example
   * ```typescript
   * const formGroup = new FormGroup({
   *   name: new FormControl(''),
   *   address: new FormGroup({
   *     street: new FormControl(''),
   *     city: new FormControl(''),
   *   }),
   *   hobbies: new FormArray([
   *     new FormControl(''),
   *   ]),
   * });
   *
   * this.formService.validateForm(formGroup);
   * ```
   */
  public validateForm(control: AbstractControl): void {
    if (control instanceof FormControl) {
      control.markAsTouched();
      control.updateValueAndValidity();
    } else if (control instanceof FormGroup) {
      Object.keys(control.controls).forEach(key => {
        this.validateForm(control.controls[key]);
      });
    } else if (control instanceof FormArray) {
      control.controls.forEach(control => {
        this.validateForm(control);
      });
    }
  }
}
