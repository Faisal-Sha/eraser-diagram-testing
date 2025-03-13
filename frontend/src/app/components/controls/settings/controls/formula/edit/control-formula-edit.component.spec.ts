import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlFormulaEditComponent } from './control-formula-edit.component';

describe('ControlFormulaEditComponent', () => {
  let component: ControlFormulaEditComponent;
  let fixture: ComponentFixture<ControlFormulaEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ControlFormulaEditComponent]
});
    fixture = TestBed.createComponent(ControlFormulaEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
