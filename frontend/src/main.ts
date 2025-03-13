import { AppComponent } from './app/app.component';
import { LocalDataStorageEffects } from './app/store/effects/local-data-storage.effect';
import { MetadataEffects } from './app/store/effects/metadata.effect';
import { SettingsEffects } from './app/store/effects/settings.effect';
import { reducer as localDataStorageReducer } from './app/store/reducers/local-data-storage.reducer';
import { reducer as settingsReducer } from './app/store/reducers/settings.reducer';
import { ChipModule } from 'primeng/chip';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { I18NextModule } from 'angular-i18next';
import { InplaceModule } from 'primeng/inplace';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TreeModule } from 'primeng/tree';
import { ToastModule } from 'primeng/toast';
import { SliderModule } from 'primeng/slider';
import { MessageModule } from 'primeng/message';
import { DragDropModule } from 'primeng/dragdrop';
import { AccordionModule } from 'primeng/accordion';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputGroupModule } from 'primeng/inputgroup';
import { PanelModule } from 'primeng/panel';
import { FieldsetModule } from 'primeng/fieldset';
import { ImageModule } from 'primeng/image';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication, enableDebugTools } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { LocalDataStorage } from './app/store/states/local-data-storage.state';
import { firstValueFrom } from 'rxjs';
import { Actions, ofType, EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { LOCALE_ID, APP_INITIALIZER, importProvidersFrom, isDevMode } from '@angular/core';
import { I18N_PROVIDERS } from './app/config/i18n-config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { AppService } from './app/app.service';

import * as LocalDataStorageActions from './app/store/actions/local-data-storage.action';

import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { QuickfillEffects } from './app/store/effects/quickfill.effect';
import { ItemEffects } from './app/store/effects/item.effect';
registerLocaleData(localeDe, 'de-DE', localeDeExtra);

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(CommonModule, RouterModule, BrowserModule, AppRoutingModule, BrowserModule, FormsModule, ReactiveFormsModule, ConfirmPopupModule, InputTextareaModule, InputTextModule, TabViewModule, ImageModule, FieldsetModule, PanelModule, InputGroupModule, InputGroupAddonModule, CalendarModule, InputNumberModule, FileUploadModule, ButtonModule, DialogModule, ProgressSpinnerModule, AccordionModule, DragDropModule, MessageModule, SliderModule, ToastModule, TreeModule, AutoCompleteModule, InplaceModule, I18NextModule.forRoot(), DropdownModule, DropdownModule, TableModule, InputSwitchModule, TooltipModule, MenuModule, ChipModule, StoreModule.forRoot({
            localDataStorage: localDataStorageReducer,
            settings: settingsReducer,
        }), EffectsModule.forRoot([
            LocalDataStorageEffects,
            MetadataEffects,
            SettingsEffects,
            QuickfillEffects,
            ItemEffects
        ])),
        AppService,
        DialogService,
        ConfirmationService,
        MessageService,
        ...I18N_PROVIDERS,
        {
            provide: LOCALE_ID,
            useValue: "de-DE",
        },
        {
            provide: APP_INITIALIZER,
            useFactory: (store: Store, actions$: Actions) => async () => {
                store.dispatch(LocalDataStorageActions.load());
                await firstValueFrom(actions$.pipe(ofType(LocalDataStorageActions.loadSuccess, LocalDataStorageActions.loadFailure)));
            },
            deps: [Store<{
                    localDataStorage: LocalDataStorage;
                }>, Actions],
            multi: true
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations()
    ]
}).then(appRef => {
    if (isDevMode()) {
        const componentRef = appRef.components[0]
        enableDebugTools(componentRef)
    }
})
.catch(err => console.error(err));
