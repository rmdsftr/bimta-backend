import { Test, TestingModule } from '@nestjs/testing';
import { KegiatanController } from 'src/kegiatan/kegiatan.controller';
import { KegiatanService } from 'src/kegiatan/kegiatan.service';

describe('KegiatanController (Mocked)', () => {
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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addKegiatan', () => {
    it('should call service.addKegiatan with correct params', async () => {
      const dto = {
        kegiatan: 'Rapat',
        tanggal: '2025-01-10',
        jam_mulai: '09:00',
        jam_selesai: '10:00',
      };

      mockKegiatanService.addKegiatan.mockResolvedValue({
        jadwal_dosen_id: 'mock-id',
        ...dto,
      });

      const result = await controller.addKegiatan('123', dto);
      expect(service.addKegiatan).toHaveBeenCalledWith('123', dto);
      expect(result.jadwal_dosen_id).toBe('mock-id');
    });
  });

  describe('getKegiatanByMonthDosen', () => {
    it('should call service.getKegiatanByMonth with parsed numbers', async () => {
      mockKegiatanService.getKegiatanByMonth.mockResolvedValue([
        { jadwal_dosen_id: '1', kegiatan: 'Test' },
      ]);

      const result = await controller.getKegiatanByMonth('123', '2025', '1');

      expect(service.getKegiatanByMonth).toHaveBeenCalledWith('123', 2025, 1);
      expect(result.length).toBe(1);
    });
  });

    describe('getKegiatanByDateDosen', () => {
        it('should call service.getKegiatanByDate', async () => {
        mockKegiatanService.getKegiatanByDate.mockResolvedValue({
            kegiatan: 'Tes',
            tanggal: '2025-01-10',
        });
        const result = await controller.getKegiatanByDate('123', '2025-01-10') as any;
        expect(result.kegiatan).toBe('Tes');

        });
    });

    describe('deleteKegiatan', () => {
        it('should call service.deleteKegiatan', async () => {
        mockKegiatanService.deleteKegiatan.mockResolvedValue({ deleted: true });
        const result = await controller.deleteKegiatan('999') as any;
        expect(result.deleted).toBe(true);

        });
    });

  describe('getKegiatanByMonthMahasiswa', () => {
    it('should call service.getKegiatanByBulan with parsed numbers', async () => {
      mockKegiatanService.getKegiatanByBulan.mockResolvedValue([
        { kegiatan: 'Mahasiswa Tes' },
      ]);

      const result = await controller.getKegiatanByBulan('2211', '2025', '2');

      expect(service.getKegiatanByBulan).toHaveBeenCalledWith('2211', 2025, 2);
      expect(result.length).toBe(1);
    });
  });

  describe('getKegiatanByDateMahasiswa', () => {
    it('should call service.getKegiatanByTahun', async () => {
      mockKegiatanService.getKegiatanByTahun.mockResolvedValue([
        { kegiatan: 'Kegiatan Tanggal Tes' },
      ]);

      const result = await controller.getKegiatanByTanggal('2211', '2025-02-10');

      expect(service.getKegiatanByTahun).toHaveBeenCalledWith('2211', '2025-02-10');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
