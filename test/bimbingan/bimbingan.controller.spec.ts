import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BimbinganController } from '../../src/bimbingan/bimbingan.controller';
import { BimbinganService } from '../../src/bimbingan/bimbingan.service';

describe('BimbinganController', () => {
  let controller: BimbinganController;
  let service: BimbinganService;

  const mockBimbinganService = {
    mahasiswaDibimbing: jest.fn(),
    jumlahMahasiswaBimbingan: jest.fn(),
    dosenPembimbing: jest.fn(),
    addMahasiswa: jest.fn(),
    hapusMahasiswaBimbingan: jest.fn(),
    selesaiBimbingan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BimbinganController],
      providers: [
        {
          provide: BimbinganService,
          useValue: mockBimbinganService,
        },
      ],
    }).compile();

    controller = module.get<BimbinganController>(BimbinganController);
    service = module.get<BimbinganService>(BimbinganService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('mahasiswaDibimbing', () => {
    it('should call service.mahasiswaDibimbing with valid dosen_id', async () => {
      const mockData = [
        {
          status_bimbingan: 'ongoing',
          users_bimbingan_mahasiswa_idTousers: {
            user_id: '123',
            nama: 'Mahasiswa Test',
            judul: 'Judul Test',
            photo_url: 'photo.jpg',
          },
        },
      ];
      mockBimbinganService.mahasiswaDibimbing.mockResolvedValue(mockData);

      const result = await controller.mahasiswaDibimbing('123');

      expect(service.mahasiswaDibimbing).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockData);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw BadRequestException for empty dosen_id', async () => {
      await expect(controller.mahasiswaDibimbing('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.mahasiswaDibimbing('   ')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('jumlahMahasiswaBimbingan', () => {
    it('should return jumlah mahasiswa bimbingan', async () => {
      mockBimbinganService.jumlahMahasiswaBimbingan.mockResolvedValue(5);

      const result = await controller.jumlahMahasiswaBimbingan('123');

      expect(service.jumlahMahasiswaBimbingan).toHaveBeenCalledWith('123');
      expect(result).toBe(5);
    });

    it('should throw BadRequestException for invalid dosen_id', async () => {
      await expect(controller.jumlahMahasiswaBimbingan('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('dosenPembimbing', () => {
    it('should return dosen pembimbing list', async () => {
      const mockData = [
        {
          users_bimbingan_dosen_idTousers: {
            nama: 'Dosen Test',
          },
        },
      ];
      mockBimbinganService.dosenPembimbing.mockResolvedValue(mockData);

      const result = await controller.dosenPembimbing('2211');

      expect(service.dosenPembimbing).toHaveBeenCalledWith('2211');
      expect(result).toEqual(mockData);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw BadRequestException for empty mahasiswa_id', async () => {
      await expect(controller.dosenPembimbing('  ')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('AddMahasiswa', () => {
    it('should call addMahasiswa service and return success', async () => {
      const mockResponse = { success: true };
      mockBimbinganService.addMahasiswa.mockResolvedValue(mockResponse);

      const dto = { dosen_id: '1', mahasiswa_id: ['100', '101'] };

      const result = await controller.AddMahasiswa(dto);

      expect(service.addMahasiswa).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResponse);
    });

    it('should handle service errors', async () => {
      const dto = { dosen_id: '', mahasiswa_id: [] };
      mockBimbinganService.addMahasiswa.mockRejectedValue(
        new BadRequestException('Daftar mahasiswa tidak boleh kosong'),
      );

      await expect(controller.AddMahasiswa(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('hapusMahasiswaBimbingan', () => {
    it('should call hapusMahasiswaBimbingan and return success', async () => {
      const mockResponse = { success: true };
      mockBimbinganService.hapusMahasiswaBimbingan.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.hapusMahasiswaBimbingan('1', '100');

      expect(service.hapusMahasiswaBimbingan).toHaveBeenCalledWith('1', '100');
      expect(result).toEqual(mockResponse);
    });

    it('should throw BadRequestException for invalid parameters', async () => {
      await expect(
        controller.hapusMahasiswaBimbingan('', '100'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.hapusMahasiswaBimbingan('1', ''),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('selesaiBimbingan', () => {
    it('should call selesaiBimbingan and return success', async () => {
      const mockResponse = { success: true };
      mockBimbinganService.selesaiBimbingan.mockResolvedValue(mockResponse);

      const result = await controller.selesaiBimbingan('100');

      expect(service.selesaiBimbingan).toHaveBeenCalledWith('100');
      expect(result).toEqual(mockResponse);
    });

    it('should throw BadRequestException for empty mahasiswa_id', async () => {
      await expect(controller.selesaiBimbingan('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});