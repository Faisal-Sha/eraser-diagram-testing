import { TestBed } from '@angular/core/testing';

import { CustomItemService } from './custom-item.service';

describe('CustomItemService', () => {
  let service: CustomItemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
