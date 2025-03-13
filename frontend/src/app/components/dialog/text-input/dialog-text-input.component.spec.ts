import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogTextInput } from './dialog-text-input.component';

describe('DialogTemplateFooterComponent', () => {
  let component: DialogTextInput;
  let fixture: ComponentFixture<DialogTextInput>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [DialogTextInput]
});
    fixture = TestBed.createComponent(DialogTextInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
