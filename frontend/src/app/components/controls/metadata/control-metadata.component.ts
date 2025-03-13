import { Component, OnDestroy, OnInit } from '@angular/core';
import { I18NEXT_SCOPE, I18NextModule } from 'angular-i18next';
import { Metadata } from 'src/app/interfaces/metadata.interface';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import * as MetadataSelectors from 'src/app/store/selectors/metadata.selector';
import * as MetadatActions from 'src/app/store/actions/metadata.action';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { FormsModule } from '@angular/forms';
import { PrimeTemplate } from 'primeng/api';
import { NgClass } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';

@Component({
    selector: 'app-control-metadata',
    templateUrl: './control-metadata.component.html',
    styleUrls: ['./control-metadata.component.scss'],
    providers: [{
      provide: I18NEXT_SCOPE,
      useValue: 'components.controls.metadata'
    }],
    standalone: true,
    imports: [
      AccordionModule,
      NgClass,
      PrimeTemplate,
      FormsModule,
      InputTextareaModule,
      InputTextModule,
      CalendarModule,
      I18NextModule
    ]
})
export class ControlMetadataComponent implements OnInit, OnDestroy {
  protected helpAccordionActivated = false;
  protected metadata!: Metadata;

  protected subscription: Subscription = new Subscription();

  /**
   * The constructor for the ControlMetadataComponent.
   *
   * @param {Store} store The store of the application.
   */
  constructor(
    protected store: Store,
  ) { }

  /**
   * Initializes the component by subscribing to the metadata state in the store.
   * Converts the 'date' field in the metadata to a Date object if it exists.
   *
   * @returns {void}
   */
  ngOnInit(): void {
    this.subscription.add(this.store.select(MetadataSelectors.selectMetadata).subscribe(metadata => {
      this.metadata = {
        ...metadata,
        date: metadata.date ? new Date(metadata.date) : null
      };
    }));
  }

  /**
   * This method is called when the component is destroyed.
   * It unsubscribes from the metadata state in the store and updates the metadata.
   *
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.updateMetadata();
  }

  /**
   * Updates the metadata in the store by dispatching an action.
   * Converts the 'date' field in the metadata to a Date object if it exists.
   *
   * @returns {void}
   */
  protected updateMetadata(): void {
    this.store.dispatch(MetadatActions.update({
        ...this.metadata,
        date: this.metadata.date ? new Date(this.metadata.date) : null
    }));
  }
}
