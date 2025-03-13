import { Injectable } from "@angular/core";
import { DialogService } from "primeng/dynamicdialog";
import { DialogTemplateFooterComponent } from "src/app/components/dialog-templates/footer/dialog-template-footer.component";
import { DialogTextInput } from "src/app/components/dialog/text-input/dialog-text-input.component";

export interface TextInputOptions {
  title: string;
  message: string;
  placeholder: string;
  initialValue?: string;
  width?: string;
  buttons: {
    confirm: string;
    cancel: string;
  };
}

@Injectable({
  providedIn: "root",
})
export class InputService {
  constructor(
    private dialogService: DialogService
  ) {}


  /**
   * Opens a dialog with a text input field and returns the user's input.
   *
   * @param options - An object containing the configuration options for the dialog.
   * @returns A Promise that resolves with the user's input or `undefined` if the dialog is canceled.
   */
  public async claimTextInput(options: TextInputOptions): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
      const dialogRef = this.dialogService.open(DialogTextInput, {
        header: options.title,
        width: options.width || "400px",
        templates: {
          footer: DialogTemplateFooterComponent,
        },
        data: {
          buttons: {
            confirm: options.buttons.confirm,
            cancel: options.buttons.cancel
          },
          message: options.message,
          value: options.initialValue || "",
          placeholder: options.placeholder || ""
        },
      });

      dialogRef.onClose.subscribe((result?: { confirmed: boolean; data: any }) => {
        resolve(result?.confirmed ? result.data.value : undefined);
      });
    });
  }
}
