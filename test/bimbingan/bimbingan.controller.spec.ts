import { Test, TestingModule } from '@nestjs/testing';
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
    it('should call service.mahasiswaDibimbing', async () => {
      mockBimbinganService.mahasiswaDibimbing.mockResolvedValue([
        { nama: 'Tes' },
      ]);

      const result = await controller.mahasiswaDibimbing('123');

      expect(service.mahasiswaDibimbing).toHaveBeenCalledWith('123');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('jumlahMahasiswaBimbingan', () => {
    it('should return jumlah mahasiswa', async () => {
      mockBimbinganService.jumlahMahasiswaBimbingan.mockResolvedValue(5);

      const result = await controller.jumlahMahasiswaBimbingan('123');

      expect(service.jumlahMahasiswaBimbingan).toHaveBeenCalledWith('123');
      expect(result).toBe(5);
    });
  });

  describe('dosenPembimbing', () => {
    it('should return dosen pembimbing', async () => {
      mockBimbinganService.dosenPembimbing.mockResolvedValue([
        { nama: 'Dosen Tes' },
      ]);

      const result = await controller.dosenPembimbing('2211');

      expect(service.dosenPembimbing).toHaveBeenCalledWith('2211');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('AddMahasiswa', () => {
    it('should call addMahasiswa service', async () => {
      mockBimbinganService.addMahasiswa.mockResolvedValue(true);

      const dto = { dosen_id: '1', mahasiswa_id: ['100', '101'] };

      const result = await controller.AddMahasiswa(dto);

      expect(service.addMahasiswa).toHaveBeenCalledWith(dto);
      expect(result).toBe(true);
    });
  });

  describe('hapusMahasiswaBimbingan', () => {
    it('should call hapusMahasiswaBimbingan', async () => {
      mockBimbinganService.hapusMahasiswaBimbingan.mockResolvedValue(true);

      const result = await controller.hapusMahasiswaBimbingan('1', '100');

      expect(service.hapusMahasiswaBimbingan).toHaveBeenCalledWith(
        '1',
        '100',
      );
      expect(result).toBe(true);
    });
  });

  describe('selesaiBimbingan', () => {
    it('should call selesaiBimbingan', async () => {
      mockBimbinganService.selesaiBimbingan.mockResolvedValue(true);

      await controller.selesaiBimbingan('100');

      expect(service.selesaiBimbingan).toHaveBeenCalledWith('100');
    });
  });
});
