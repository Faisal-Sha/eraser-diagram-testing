import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlCurrencyComponent } from './control-currency.component';

describe('ControlCurrencyComponent', () => {
  let component: ControlCurrencyComponent;
  let fixture: ComponentFixture<ControlCurrencyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ControlCurrencyComponent]
});
    fixture = TestBed.createComponent(ControlCurrencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
