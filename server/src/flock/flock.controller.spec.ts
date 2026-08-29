import { Test, TestingModule } from '@nestjs/testing';
import { FlockController } from './flock.controller';

describe('FlockController', () => {
  let controller: FlockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlockController],
    }).compile();

    controller = module.get<FlockController>(FlockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
