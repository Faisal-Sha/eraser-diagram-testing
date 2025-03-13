import { AfterViewChecked, Component } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { I18NextService } from 'angular-i18next';
import { PrimeNGConfig } from 'primeng/api';
import { AppService } from './app.service';
import { NgStyle } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-root',
    template: `
  <div style="display:flex; justify-content: center; align-items: center">
    <p-confirmDialog />
    <p-toast />
    <div [ngStyle]="appService.getCustomContentStyle()" class="w-full">
      <router-outlet></router-outlet>
    </div>
  </div>`,
    standalone: true,
    imports: [
      NgStyle,
      RouterOutlet,
      ConfirmDialogModule,
      ToastModule
    ]
})

export class AppComponent implements AfterViewChecked {
  previousHeight: number = 0;

  /**
   * Initializes the component.
   *
   * Parses the custom-style query parameter and uses it to set the custom content style.
   * Also sets the translation for the PrimeNG components.
   */
  constructor(
    private route: ActivatedRoute, public appService: AppService,
    private primeNGConfig: PrimeNGConfig,
    private i18NextService: I18NextService
  ) {
    this.route.queryParams.subscribe(params => {
      if(typeof params['custom-style'] !== 'undefined') {
        try {
          const customStyle = JSON.parse(params['custom-style']);
          this.appService.setCustomContentStyle(customStyle);
        } catch (e) {
          console.error('Failed to parse custom-style query parameter', e);
        }
      }
    });

    this.primeNGConfig.setTranslation({ 
      "dayNames": [
        this.i18NextService.t('calendar.day-name.sunday'), 
        this.i18NextService.t('calendar.day-name.monday'),
        this.i18NextService.t('calendar.day-name.tuesday'), 
        this.i18NextService.t('calendar.day-name.wednesday'), 
        this.i18NextService.t('calendar.day-name.thursday'), 
        this.i18NextService.t('calendar.day-name.friday'), 
        this.i18NextService.t('calendar.day-name.saturday')
      ],
      "dayNamesShort": [
        this.i18NextService.t('calendar.day-name-min.sunday'), 
        this.i18NextService.t('calendar.day-name-min.monday'),
        this.i18NextService.t('calendar.day-name-min.tuesday'), 
        this.i18NextService.t('calendar.day-name-min.wednesday'), 
        this.i18NextService.t('calendar.day-name-min.thursday'), 
        this.i18NextService.t('calendar.day-name-min.friday'), 
        this.i18NextService.t('calendar.day-name-min.saturday')
      ],
      "dayNamesMin": [
        this.i18NextService.t('calendar.day-name-min.sunday'), 
        this.i18NextService.t('calendar.day-name-min.monday'),
        this.i18NextService.t('calendar.day-name-min.tuesday'), 
        this.i18NextService.t('calendar.day-name-min.wednesday'), 
        this.i18NextService.t('calendar.day-name-min.thursday'), 
        this.i18NextService.t('calendar.day-name-min.friday'), 
        this.i18NextService.t('calendar.day-name-min.saturday')
      ],
      "monthNames": [
        this.i18NextService.t('calendar.month-name.january'), 
        this.i18NextService.t('calendar.month-name.february'), 
        this.i18NextService.t('calendar.month-name.march'), 
        this.i18NextService.t('calendar.month-name.april'), 
        this.i18NextService.t('calendar.month-name.may'), 
        this.i18NextService.t('calendar.month-name.june'), 
        this.i18NextService.t('calendar.month-name.july'), 
        this.i18NextService.t('calendar.month-name.august'), 
        this.i18NextService.t('calendar.month-name.september'), 
        this.i18NextService.t('calendar.month-name.october'), 
        this.i18NextService.t('calendar.month-name.november'), 
        this.i18NextService.t('calendar.month-name.december')
      ],
      "monthNamesShort": [
        this.i18NextService.t('calendar.month-name-short.january'), 
        this.i18NextService.t('calendar.month-name-short.february'), 
        this.i18NextService.t('calendar.month-name-short.march'), 
        this.i18NextService.t('calendar.month-name-short.april'), 
        this.i18NextService.t('calendar.month-name-short.may'), 
        this.i18NextService.t('calendar.month-name-short.june'), 
        this.i18NextService.t('calendar.month-name-short.july'), 
        this.i18NextService.t('calendar.month-name-short.august'), 
        this.i18NextService.t('calendar.month-name-short.september'), 
        this.i18NextService.t('calendar.month-name-short.october'), 
        this.i18NextService.t('calendar.month-name-short.november'), 
        this.i18NextService.t('calendar.month-name-short.december')
      ],
      "today": this.i18NextService.t('calendar.today'),
      "weekHeader": this.i18NextService.t('calendar.weekHeader')
    })
  }

  /**
   * This lifecycle hook is called after every change detection cycle in the component.
   * It is used to check if the height of the component has changed and send a message to the parent window.
   */
  ngAfterViewChecked() {
    const body = document.body;
    const html = document.documentElement;
    /**
     * Calculate the maximum height between the scrollHeight, offsetHeight, clientHeight,
     * scrollHeight, and offsetHeight of the body and html elements.
     */
    const currentHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );

    /**
     * If the current height is different from the previous height and it is not zero,
     * update the previous height and send a message to the parent window with the new height.
     */
    if (this.previousHeight !== currentHeight && currentHeight) {
      this.previousHeight = currentHeight;
      window.parent.postMessage(
        {
          height: currentHeight
        },
        '*'
      );
    }
  }
}

