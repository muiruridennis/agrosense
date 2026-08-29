import { Test, TestingModule } from '@nestjs/testing';
import { FlockAnalyticsController } from './flock-analytics.controller';

describe('FlockAnalyticsController', () => {
  let controller: FlockAnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlockAnalyticsController],
    }).compile();

    controller = module.get<FlockAnalyticsController>(FlockAnalyticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
