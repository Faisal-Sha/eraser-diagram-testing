import { Component, OnDestroy, OnInit } from '@angular/core';
import { I18NEXT_SCOPE, I18NextModule } from 'angular-i18next';
import { FormControl, Validators, FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Settings } from 'src/app/interfaces/settings.interface';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import * as SettingsSelectors from '../../../../../store/selectors/settings.selector';
import * as SettingsActions from '../../../../../store/actions/settings.action';
import { MessageModule } from 'primeng/message';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputGroupModule } from 'primeng/inputgroup';
import { SliderModule } from 'primeng/slider';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { fadeInOutAnimation } from 'src/app/utils/animations.util';

@Component({
    selector: "settings-section-hourly-rates",
    templateUrl: "./settings-section-hourly-rates.component.html",
    styleUrls: ["./settings-section-hourly-rates.component.scss"],
    providers: [{
      provide: I18NEXT_SCOPE,
      useValue: "components.controls.settings.hourly-rates",
    }],
    standalone: true,
    animations: [fadeInOutAnimation],
    imports: [
        PanelModule,
        FormsModule,
        TooltipModule,
        InputSwitchModule,
        SliderModule,
        InputGroupModule,
        InputNumberModule,
        ReactiveFormsModule,
        InputGroupAddonModule,
        MessageModule,
        I18NextModule,
    ],
})
export class SettingsSectionHourlyRatesComponent implements OnInit, OnDestroy {
  protected manufacturingAssemblyRate!: number;
  protected seperateManufacturingAssembly!: boolean;

  protected settings!: Settings;
  private subscriptions = new Subscription();

  protected form!: FormGroup;

  constructor(
    private store: Store
  ) {
  }

  /**
   * Initializes the component and sets up the form controls and subscriptions.
   *
   * @returns {void}
   */
  ngOnInit(): void {
    // Create a form group with form controls for each setting
    this.form = new FormGroup({
      seperateManufacturingAssembly: new FormControl(this.settings?.calculation?.seperateManufacturingAssembly),
      manufacturingSplitAmount: new FormControl(this.settings?.calculation?.manufacturingSplitAmount, [Validators.required, Validators.min(0), Validators.max(100)]),
      hourlyMixedPrice: new FormControl(this.settings?.calculation?.hourlyMixedPrice, [Validators.required, Validators.min(0)]),
      hourlyManufacturingPrice: new FormControl(this.settings?.calculation?.hourlyManufacturingPrice, [Validators.required, Validators.min(0)]),
      hourlyAssemblyPrice: new FormControl(this.settings?.calculation?.hourlyAssemblyPrice, [Validators.required, Validators.min(0)])
    });

    // Subscribe to the temporary settings state to update form controls
    this.subscriptions.add(
      this.store.select(SettingsSelectors.selectTemporary).subscribe((settings) => {
        this.settings = settings;

        const controls = Object.keys(this.form.controls) as (keyof Settings['calculation'])[];
        for (const key of controls) {
          const controlKey = key as keyof Settings['calculation'];
          this.form.controls[controlKey]?.setValue(this.settings?.calculation[controlKey], { emitEvent: false });
        }
      })
    );

    // Subscribe to form value changes and dispatch an update action with the new settings
    this.form.valueChanges.subscribe((value) => {
      this.store.dispatch(SettingsActions.update({
        settings: {
          ...this.settings,
          calculation: {
            ...value
          }
        }
      }));
    });
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
}
