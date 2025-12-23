import { Test, TestingModule } from '@nestjs/testing';
import { KegiatanController } from '../../src/kegiatan/kegiatan.controller';
import { KegiatanService } from '../../src/kegiatan/kegiatan.service';
import { AddKegiatanDto } from '../../src/kegiatan/dto/add-kegiatan.dto';

describe('KegiatanController - Complete Coverage', () => {
  let controller: KegiatanController;
  let service: KegiatanService;

  const mockKegiatanService = {
    addKegiatan: jest.fn(),
    getKegiatanByMonth: jest.fn(),
    getKegiatanByDate: jest.fn(),
    deleteKegiatan: jest.fn(),
    getKegiatanByBulan: jest.fn(),
    getKegiatanByTahun: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KegiatanController],
      providers: [
        {
          provide: KegiatanService,
          useValue: mockKegiatanService,
        },
      ],
    }).compile();

    controller = module.get<KegiatanController>(KegiatanController);
    service = module.get<KegiatanService>(KegiatanService);
    jest.clearAllMocks();
  });

  describe('addKegiatan', () => {
    it('should add kegiatan', async () => {
      const dosen_id = '123';
      const dto: AddKegiatanDto = {
        kegiatan: 'Meeting',
  tanggal: '2024-01-01',
  jam_mulai: '09:00',
  jam_selesai: '10:00',
      };
      const mockResult = { success: true };

      mockKegiatanService.addKegiatan.mockResolvedValue(mockResult);
      const result = await controller.addKegiatan(dosen_id, dto);

      expect(service.addKegiatan).toHaveBeenCalledWith(dosen_id, dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getKegiatanByMonth', () => {
    it('should get kegiatan by month', async () => {
      const dosen_id = '123';
      const year = '2024';
      const month = '1';
      const mockResult = [{ datetime: new Date(), keterangan: 'Test' }];

      mockKegiatanService.getKegiatanByMonth.mockResolvedValue(mockResult);
      const result = await controller.getKegiatanByMonth(dosen_id, year, month);

      expect(service.getKegiatanByMonth).toHaveBeenCalledWith(dosen_id, 2024, 1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getKegiatanByDate', () => {
    it('should get kegiatan by date', async () => {
      const dosen_id = '123';
      const date = '2024-01-01';
      const mockResult = [{ datetime: new Date(), keterangan: 'Test' }];

      mockKegiatanService.getKegiatanByDate.mockResolvedValue(mockResult);
      const result = await controller.getKegiatanByDate(dosen_id, date);

      expect(service.getKegiatanByDate).toHaveBeenCalledWith(dosen_id, date);
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteKegiatan', () => {
    it('should delete kegiatan', async () => {
      const jadwal_dosen_id = '1';
      const mockResult = { success: true };

      mockKegiatanService.deleteKegiatan.mockResolvedValue(mockResult);
      const result = await controller.deleteKegiatan(jadwal_dosen_id);

      expect(service.deleteKegiatan).toHaveBeenCalledWith(jadwal_dosen_id);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getKegiatanByBulan', () => {
    it('should get kegiatan mahasiswa by bulan', async () => {
      const mahasiswa_id = '456';
      const year = '2024';
      const month = '1';
      const mockResult = [{ datetime: new Date() }];

      mockKegiatanService.getKegiatanByBulan.mockResolvedValue(mockResult);
      const result = await controller.getKegiatanByBulan(mahasiswa_id, year, month);

      expect(service.getKegiatanByBulan).toHaveBeenCalledWith(mahasiswa_id, 2024, 1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getKegiatanByTanggal', () => {
    it('should get kegiatan mahasiswa by tanggal', async () => {
      const mahasiswa_id = '456';
      const date = '2024-01-01';
      const mockResult = [{ datetime: new Date() }];

      mockKegiatanService.getKegiatanByTahun.mockResolvedValue(mockResult);
      const result = await controller.getKegiatanByTanggal(mahasiswa_id, date);

      expect(service.getKegiatanByTahun).toHaveBeenCalledWith(mahasiswa_id, date);
      expect(result).toEqual(mockResult);
    });
  });
});