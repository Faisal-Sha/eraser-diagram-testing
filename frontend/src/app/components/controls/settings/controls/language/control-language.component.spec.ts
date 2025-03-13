import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlLanguageComponent } from './control-language.component';

describe('ControlLanguageComponent', () => {
  let component: ControlLanguageComponent;
  let fixture: ComponentFixture<ControlLanguageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ControlLanguageComponent]
});
    fixture = TestBed.createComponent(ControlLanguageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
