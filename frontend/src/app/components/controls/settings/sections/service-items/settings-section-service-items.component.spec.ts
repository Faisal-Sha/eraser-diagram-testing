import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsSectionServiceItemsComponent } from './settings-section-service-items.component';

describe('SettingsSectionServiceItemsComponent', () => {
  let component: SettingsSectionServiceItemsComponent;
  let fixture: ComponentFixture<SettingsSectionServiceItemsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [SettingsSectionServiceItemsComponent]
});
    fixture = TestBed.createComponent(SettingsSectionServiceItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
