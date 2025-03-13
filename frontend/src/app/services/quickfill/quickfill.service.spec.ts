import { TestBed } from '@angular/core/testing';

import { QuickfillService } from './quickfill.service';

describe('QuickfillService', () => {
  let service: QuickfillService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuickfillService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
