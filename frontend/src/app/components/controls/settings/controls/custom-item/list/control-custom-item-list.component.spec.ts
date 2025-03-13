import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlItemSpecificationListComponent } from './control-custom-item-list.component';

describe('ControlItemSpecificationListComponent', () => {
  let component: ControlItemSpecificationListComponent;
  let fixture: ComponentFixture<ControlItemSpecificationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlItemSpecificationListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ControlItemSpecificationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
