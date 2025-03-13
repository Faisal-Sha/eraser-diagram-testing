import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsSectionGeneralComponent } from './settings-section-general.component';

describe('SettingsSectionGeneralComponent', () => {
  let component: SettingsSectionGeneralComponent;
  let fixture: ComponentFixture<SettingsSectionGeneralComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [SettingsSectionGeneralComponent]
});
    fixture = TestBed.createComponent(SettingsSectionGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
