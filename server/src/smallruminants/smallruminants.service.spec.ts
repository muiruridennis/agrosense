import { Test, TestingModule } from '@nestjs/testing';
import { SmallruminantsService } from './smallruminants.service';

describe('SmallruminantsService', () => {
  let service: SmallruminantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmallruminantsService],
    }).compile();

    service = module.get<SmallruminantsService>(SmallruminantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
