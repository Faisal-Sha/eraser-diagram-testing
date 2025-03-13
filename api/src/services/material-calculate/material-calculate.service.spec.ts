import { Test, TestingModule } from '@nestjs/testing';
import { MaterialCalculateService } from './material-calculate.service';

describe('MaterialCalculateService', () => {
  let service: MaterialCalculateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaterialCalculateService],
    }).compile();

    service = module.get<MaterialCalculateService>(MaterialCalculateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
