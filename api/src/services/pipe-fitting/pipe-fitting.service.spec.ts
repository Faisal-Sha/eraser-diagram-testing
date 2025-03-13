import { Test, TestingModule } from '@nestjs/testing';
import { PipeFittingService } from './pipe-fitting.service';

describe('PipeFittingService', () => {
  let service: PipeFittingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PipeFittingService],
    }).compile();

    service = module.get<PipeFittingService>(PipeFittingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
