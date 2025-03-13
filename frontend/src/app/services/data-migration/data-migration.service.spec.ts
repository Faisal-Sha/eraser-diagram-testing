import { TestBed } from '@angular/core/testing';

import { DataMigrationService } from './data-migration.service';

describe('DataMigrationService', () => {
  let service: DataMigrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataMigrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
