import { Test, TestingModule } from '@nestjs/testing';
import { FlockRecordsController } from './flock-records.controller';

describe('FlockRecordsController', () => {
  let controller: FlockRecordsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlockRecordsController],
    }).compile();

    controller = module.get<FlockRecordsController>(FlockRecordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
