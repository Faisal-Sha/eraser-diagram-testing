import { TestBed } from '@angular/core/testing';

import { UnitPriceService } from './unit-price.service';

describe('AggregationService', () => {
  let service: UnitPriceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnitPriceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
