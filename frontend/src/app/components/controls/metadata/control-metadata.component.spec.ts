import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlMetadataComponent } from './control-metadata.component';

describe('ControlMetadataComponent', () => {
  let component: ControlMetadataComponent;
  let fixture: ComponentFixture<ControlMetadataComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ControlMetadataComponent]
});
    fixture = TestBed.createComponent(ControlMetadataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
