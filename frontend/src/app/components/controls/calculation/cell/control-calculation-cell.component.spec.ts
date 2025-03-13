import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlCalculationCellComponent } from './control-calculation-cell.component';

describe('ControlCalculationComponent', () => {
  let component: ControlCalculationCellComponent;
  let fixture: ComponentFixture<ControlCalculationCellComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ControlCalculationCellComponent]
});
    fixture = TestBed.createComponent(ControlCalculationCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
