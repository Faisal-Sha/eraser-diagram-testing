import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlCalculationComponent } from './control-calculation.component';

describe('ControlCalculationComponent', () => {
  let component: ControlCalculationComponent;
  let fixture: ComponentFixture<ControlCalculationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ControlCalculationComponent]
});
    fixture = TestBed.createComponent(ControlCalculationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
