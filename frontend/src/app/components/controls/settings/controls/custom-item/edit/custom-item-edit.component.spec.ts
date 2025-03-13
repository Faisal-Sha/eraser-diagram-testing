import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlItemSpecificationEditComponent } from './custom-item-edit.component';

describe('ControlItemSpecificationEditComponent', () => {
  let component: ControlItemSpecificationEditComponent;
  let fixture: ComponentFixture<ControlItemSpecificationEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlItemSpecificationEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ControlItemSpecificationEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
