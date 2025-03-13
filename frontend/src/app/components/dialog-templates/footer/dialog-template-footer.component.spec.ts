import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogTemplateFooterComponent } from './dialog-template-footer.component';

describe('DialogTemplateFooterComponent', () => {
  let component: DialogTemplateFooterComponent;
  let fixture: ComponentFixture<DialogTemplateFooterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [DialogTemplateFooterComponent]
});
    fixture = TestBed.createComponent(DialogTemplateFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
