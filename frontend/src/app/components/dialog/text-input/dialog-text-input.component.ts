import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-main-dialog',
  templateUrl: './dialog-text-input.component.html',
  styleUrls: ['./dialog-text-input.component.scss'],
  standalone: true,
  imports: [DialogModule, InputTextModule, FormsModule]
})
export class DialogTextInput {

  /**
   * Creates a dialog to input a text.
   *
   * This component is intended to be used as a {@link DynamicDialog} component.
   * The config object passed to the dialog should contain the following properties:
   * @param {string} [message] - The message to be displayed in the dialog.
   * @param {string} [placeholder] - The placeholder to be used in the input field.
   * @param {string} [value] - The default value of the input field.
   */
  constructor(
    protected dialogConfig: DynamicDialogConfig,
  ) { }
}
