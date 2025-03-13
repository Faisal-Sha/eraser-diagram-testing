import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlFormulaListComponent } from './control-formula-list.component';

describe('ControlFormulaListComponent', () => {
  let component: ControlFormulaListComponent;
  let fixture: ComponentFixture<ControlFormulaListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ControlFormulaListComponent]
});
    fixture = TestBed.createComponent(ControlFormulaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
