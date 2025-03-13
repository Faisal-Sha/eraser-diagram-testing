import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemTypeSelectionComponent } from './item-type-selection.component';

describe('ControlCalculationComponent', () => {
  let component: ItemTypeSelectionComponent;
  let fixture: ComponentFixture<ItemTypeSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ItemTypeSelectionComponent]
});
    fixture = TestBed.createComponent(ItemTypeSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
