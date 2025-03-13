import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsSectionFormulasComponent } from './settings-section-formulas.component';

describe('SettingsSectionFormulasComponent', () => {
  let component: SettingsSectionFormulasComponent;
  let fixture: ComponentFixture<SettingsSectionFormulasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [SettingsSectionFormulasComponent]
});
    fixture = TestBed.createComponent(SettingsSectionFormulasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
