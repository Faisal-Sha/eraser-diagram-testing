import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsSectionCustomItemsComponent } from './settings-section-custom-items.component';

describe('SettingsSectionCustomItemsComponent', () => {
  let component: SettingsSectionCustomItemsComponent;
  let fixture: ComponentFixture<SettingsSectionCustomItemsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [SettingsSectionCustomItemsComponent]
});
    fixture = TestBed.createComponent(SettingsSectionCustomItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
