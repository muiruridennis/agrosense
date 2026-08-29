import { Test, TestingModule } from '@nestjs/testing';
import { FlockAnalyticsService } from './flock-analytics.service';

describe('FlockAnalyticsService', () => {
  let service: FlockAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlockAnalyticsService],
    }).compile();

    service = module.get<FlockAnalyticsService>(FlockAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
