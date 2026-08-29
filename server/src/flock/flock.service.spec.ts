import { Test, TestingModule } from '@nestjs/testing';
import { FlockService } from './flock.service';

describe('FlockService', () => {
  let service: FlockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlockService],
    }).compile();

    service = module.get<FlockService>(FlockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
