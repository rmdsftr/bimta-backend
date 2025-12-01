import { Test, TestingModule } from '@nestjs/testing';
import { RiwayatController } from '../../src/riwayat/riwayat.controller';
import { RiwayatService } from '../../src/riwayat/riwayat.service';

describe('RiwayatController', () => {
  let controller: RiwayatController;
  let service: RiwayatService;

  const mockService = {
    riwayatBimbingan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiwayatController],
      providers: [
        {
          provide: RiwayatService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<RiwayatController>(RiwayatController);
    service = module.get<RiwayatService>(RiwayatService);

    jest.clearAllMocks();
  });

  it('should return riwayat from service', async () => {
    mockService.riwayatBimbingan.mockResolvedValue(['data']);

    const result = await controller.getRiwayat('MHS1');

    expect(result).toEqual(['data']);
    expect(mockService.riwayatBimbingan).toHaveBeenCalledWith('MHS1');
  });
});
