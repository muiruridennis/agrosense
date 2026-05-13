import { Test, TestingModule } from '@nestjs/testing';
import { SmallruminantsController } from './smallruminants.controller';

describe('SmallruminantsController', () => {
  let controller: SmallruminantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmallruminantsController],
    }).compile();

    controller = module.get<SmallruminantsController>(SmallruminantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
