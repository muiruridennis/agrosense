import { Test, TestingModule } from '@nestjs/testing';
import { UnifiedHealthEventService } from './health-event.service';

describe('UnifiedHealthEventService', () => {
  let service: UnifiedHealthEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnifiedHealthEventService],
    }).compile();

    service = module.get<UnifiedHealthEventService>(UnifiedHealthEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
