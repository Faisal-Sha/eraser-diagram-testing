import { Inject, Injectable } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { I18NEXT_SERVICE, I18NextPipe, ITranslationService } from 'angular-i18next';
import { ControlSettingsComponent } from '../../components/controls/settings/control-settings.component';
import { DialogTemplateFooterComponent } from '../../components/dialog-templates/footer/dialog-template-footer.component';
import { Store } from '@ngrx/store';
import * as SettingsActions from '../../store/actions/settings.action';
import * as LocalDataStorageActions from '../../store/actions/local-data-storage.action';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  /**
   * Constructor.
   *
   * @param dialogService The dialog service to show the settings dialog.
   * @param store The ngrx store to dispatch the change settings action.
   * @param actions$ The actions subject to listen to the save success action.
   * @param i18NextPipe The i18next pipe to translate the confirmation texts.
   * @param i18NextService The i18next service to change the language.
   */
  constructor(
    private dialogService: DialogService,
    protected store: Store,
    private actions$: Actions,
    private i18NextPipe: I18NextPipe,
    @Inject(I18NEXT_SERVICE) private i18NextService: ITranslationService,
  ) {
  }

  /**
   * Opens a dialog to edit the application settings.
   *
   * @returns A promise that resolves when the dialog is closed.
   */
  public async showEditDialog(): Promise<void> {
    // Open the settings dialog using the DialogService
    const dialogRef = this.dialogService.open(ControlSettingsComponent, {
      header: this.i18NextPipe.transform('components.controls.settings.title'),
      width: '50vw',
      templates: {
        footer: DialogTemplateFooterComponent
      },
      data: {
        buttons: {
          confirm: this.i18NextPipe.transform('components.controls.settings.button.confirm'),
          cancel: this.i18NextPipe.transform('components.controls.settings.button.cancel')
        }
      }
    });

    // Store the current language before the dialog is closed
    const previousLanguage = this.i18NextService.language;

    // Listen for the dialog closing event
    dialogRef.onClose.subscribe((result?: { confirmed: boolean; data: any }) => {
      if (result?.confirmed) {
        // If the user confirmed the changes, check if the language has changed
        if (previousLanguage !== this.i18NextService.language) {
          // If the language has changed, wait for the save success action
          this.actions$.pipe(
            ofType(LocalDataStorageActions.saveSuccess),
            take(1)
          ).subscribe(() => {
            // After the save success action, reload the window to apply the new language
            setTimeout(() => {
              window.location.reload();
            }, 100);
          });
        }
        // Dispatch the apply settings action
        this.store.dispatch(SettingsActions.apply());
        return;
      }

      // If the user cancelled the changes, check if the language has changed
      if (previousLanguage !== this.i18NextService.language) {
        // If the language has changed, revert it back to the previous language
        this.i18NextService.changeLanguage(previousLanguage);
      }
      // Dispatch the discard settings action
      this.store.dispatch(SettingsActions.discard());
    });
  }
}
