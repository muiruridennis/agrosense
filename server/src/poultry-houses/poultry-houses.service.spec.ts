import { Test, TestingModule } from '@nestjs/testing';
import { PoultryHousesService } from './poultry-houses.service';

describe('PoultryHousesService', () => {
  let service: PoultryHousesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PoultryHousesService],
    }).compile();

    service = module.get<PoultryHousesService>(PoultryHousesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
