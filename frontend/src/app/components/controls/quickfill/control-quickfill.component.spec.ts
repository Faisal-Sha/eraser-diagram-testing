import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlQuickfillComponent } from './control-quickfill.component';

describe('ControlSettingsComponent', () => {
  let component: ControlQuickfillComponent;
  let fixture: ComponentFixture<ControlQuickfillComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ControlQuickfillComponent]
});
    fixture = TestBed.createComponent(ControlQuickfillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
