import { Component } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Button } from 'primeng/button';

@Component({
    selector: 'app-dialog-template-footer',
    templateUrl: './dialog-template-footer.component.html',
    styleUrls: ['./dialog-template-footer.component.scss'],
    standalone: true,
    imports: [Button]
})
export class DialogTemplateFooterComponent {

  /**
   * The constructor for the component.
   * @param dialogRef The reference to the dialog itself.
   * @param dialogConfig The configuration of the dialog.
   */
  constructor(
    protected dialogRef: DynamicDialogRef,
    protected dialogConfig: DynamicDialogConfig
  ) {
    
  }

  /**
   * Returns the button class based on the configuration provided.
   *
   * @returns The button class as a string.
   */
  protected getButtonClass() : string {
    // If the confirmStyle buttonClass is provided in the dialogConfig, use it.
    // Otherwise, use an empty string.
    // Append "confirm-button" to the buttonClass.
    // Trim any leading or trailing whitespace.
    return ((this.dialogConfig.data?.buttons?.confirmStyle?.buttonClass ?? "") + " confirm-button").trim();
  }

  /**
   * Returns the icon class based on the configuration provided.
   *
   * @remarks
   * This function retrieves the icon class from the dialog configuration.
   * If the icon class is not provided in the configuration, it defaults to "pi pi-check".
   *
   * @returns A string representing the icon class.
   */
  protected getIconClass() : string {
    return this.dialogConfig.data?.buttons?.confirmStyle?.iconClass ?? "pi pi-check";
  }

  /**
   * Handles the submission of the dialog.
   *
   * Calls the `onSubmit` function provided in the dialog configuration if it exists.
   * If the `onSubmit` function returns `false`, the submission is cancelled.
   * Otherwise, closes the dialog with a confirmation object containing `true` for `confirmed` and the dialog data.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the submission is complete.
   */
  protected async submit(): Promise<void> {
    if (typeof this.dialogConfig.data.onSubmit === 'function') {
      if (!(await this.dialogConfig.data.onSubmit())) {
        return;
      }
    }
    this.dialogRef.close({ confirmed: true, data: this.dialogConfig.data });
  }

  /**
   * Handles the cancellation of the dialog.
   *
   * Calls the `onCancel` function provided in the dialog configuration if it exists.
   * If the `onCancel` function returns `false`, the cancellation is cancelled.
   * Otherwise, closes the dialog with a confirmation object containing `false` for `confirmed` and the dialog data.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the cancellation is complete.
   */
  protected async cancel(): Promise<void> {
    if (typeof this.dialogConfig.data.onCancel === 'function') {
      if (!(await this.dialogConfig.data.onCancel())) {
        return;
      }
    }
    this.dialogRef.close({ confirmed: false, data: this.dialogConfig.data });
  }
}
