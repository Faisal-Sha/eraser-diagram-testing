import { Test, TestingModule } from '@nestjs/testing';
import { EffordCalculateService } from './efford-calculate.service';

describe('EffordCalculateService', () => {
  let service: EffordCalculateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EffordCalculateService],
    }).compile();

    service = module.get<EffordCalculateService>(EffordCalculateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
