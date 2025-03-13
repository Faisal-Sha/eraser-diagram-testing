
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { I18NEXT_SCOPE } from 'angular-i18next';
import { ControlCalculationComponent } from '../../controls/calculation/control-calculation.component';
import { ControlActionsComponent } from '../../controls/actions/control-actions.component';
import { ControlMetadataComponent } from '../../controls/metadata/control-metadata.component';

@Component({
    selector: 'app-page-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    providers: [{
            provide: I18NEXT_SCOPE,
            useValue: 'component.home'
        }],
    standalone: true,
    imports: [ControlMetadataComponent, ControlActionsComponent, ControlCalculationComponent]
})
export class HomePageComponent implements OnInit, AfterViewInit {

  constructor(
  ) {}

  /**
   * This lifecycle hook is called after the component's view has been fully initialized.
   * At this point, the component's template is available and all child components have been initialized.
   * This is the best place to perform all initialization that require the component's view to be available.
   *
   * <i>Angular calls this hook after the component's view has been fully initialized.</i>
   */
  ngAfterViewInit(): void {
  }

  /**
   * This lifecycle hook is called after the component's properties have been initialized.
   * At this point, the component's properties are available and can be modified.
   * This is the best place to perform all initialization that require the component's properties to be available.
   *
   * <i>Angular calls this hook after the component's properties have been initialized.</i>
   */
  ngOnInit(): void {
  }
}
