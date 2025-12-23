import { Test, TestingModule } from '@nestjs/testing';
import { RiwayatController } from '../../src/riwayat/riwayat.controller';
import { RiwayatService } from '../../src/riwayat/riwayat.service';
import { NotFoundException } from '@nestjs/common';

describe('RiwayatController - Complete Coverage', () => {
  let controller: RiwayatController;
  let service: RiwayatService;

  const mockRiwayatService = {
    riwayatBimbingan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiwayatController],
      providers: [
        {
          provide: RiwayatService,
          useValue: mockRiwayatService,
        },
      ],
    }).compile();

    controller = module.get<RiwayatController>(RiwayatController);
    service = module.get<RiwayatService>(RiwayatService);
    jest.clearAllMocks();
  });

  describe('getRiwayat', () => {
    it('should return riwayat bimbingan', async () => {
      const mahasiswa_id = '123';
      const mockResult = [
        {
          id: 'prog1',
          tanggal: new Date('2024-01-10'),
          pembahasan: 'Progress 1',
          hasil: 'Good',
          jenis: 'online',
        },
      ];

      mockRiwayatService.riwayatBimbingan.mockResolvedValue(mockResult);

      const result = await controller.getRiwayat(mahasiswa_id);

      expect(service.riwayatBimbingan).toHaveBeenCalledWith(mahasiswa_id);
      expect(result).toEqual(mockResult);
    });

    it('should handle empty array', async () => {
      const mahasiswa_id = '456';
      mockRiwayatService.riwayatBimbingan.mockResolvedValue([]);

      const result = await controller.getRiwayat(mahasiswa_id);
      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      const mahasiswa_id = '999';
      mockRiwayatService.riwayatBimbingan.mockRejectedValue(
        new NotFoundException('Mahasiswa tidak ditemukan')
      );

      await expect(controller.getRiwayat(mahasiswa_id)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});