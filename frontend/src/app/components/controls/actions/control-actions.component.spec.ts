import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlActionsComponent } from './control-actions.component';

describe('ControlActionsComponent', () => {
  let component: ControlActionsComponent;
  let fixture: ComponentFixture<ControlActionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ControlActionsComponent]
});
    fixture = TestBed.createComponent(ControlActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
