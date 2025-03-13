import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsSectionOverrideItemsComponent } from './settings-section-override-items.component';

describe('SettingsSectionOverrideItemsComponent', () => {
  let component: SettingsSectionOverrideItemsComponent;
  let fixture: ComponentFixture<SettingsSectionOverrideItemsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [SettingsSectionOverrideItemsComponent]
});
    fixture = TestBed.createComponent(SettingsSectionOverrideItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
