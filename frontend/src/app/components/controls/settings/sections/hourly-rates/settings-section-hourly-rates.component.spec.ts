import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsSectionHourlyRatesComponent } from './settings-section-hourly-rates.component';

describe('SettingsSectionHourlyRatesComponent', () => {
  let component: SettingsSectionHourlyRatesComponent;
  let fixture: ComponentFixture<SettingsSectionHourlyRatesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [SettingsSectionHourlyRatesComponent]
});
    fixture = TestBed.createComponent(SettingsSectionHourlyRatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
