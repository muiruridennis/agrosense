import { Test, TestingModule } from '@nestjs/testing';
import { FlockRecordsService } from './flock-records.service';

describe('FlockRecordsService', () => {
  let service: FlockRecordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlockRecordsService],
    }).compile();

    service = module.get<FlockRecordsService>(FlockRecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
