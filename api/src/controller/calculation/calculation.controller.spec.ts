import { Test, TestingModule } from '@nestjs/testing';
import { CalculationController } from './calculation.controller';

describe('CalculationController', () => {
  let controller: CalculationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalculationController],
    }).compile();

    controller = module.get<CalculationController>(CalculationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
