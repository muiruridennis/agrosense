import { Test, TestingModule } from '@nestjs/testing';
import { PoultryHousesController } from './poultry-houses.controller';

describe('PoultryHousesController', () => {
  let controller: PoultryHousesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PoultryHousesController],
    }).compile();

    controller = module.get<PoultryHousesController>(PoultryHousesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
