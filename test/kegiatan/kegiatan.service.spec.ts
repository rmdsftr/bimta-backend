import { Test, TestingModule } from '@nestjs/testing';
import { KegiatanService } from '../../src/kegiatan/kegiatan.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('KegiatanService', () => {
  let service: KegiatanService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KegiatanService,
        {
          provide: PrismaService,
          useValue: {
            jadwal_dosen: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
            bimbingan: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<KegiatanService>(KegiatanService);
    prisma = module.get(PrismaService);
  });


  // ADD KEGIATAN
  describe('addKegiatan', () => {
    it('should add kegiatan successfully', async () => {
      const dto = {
        kegiatan: 'Rapat',
        tanggal: '2025-02-01',
        jam_mulai: '10:00',
        jam_selesai: '12:00',
      };

      const expectedReturn = { id: 'xxx', kegiatan: 'Rapat' };

      prisma.jadwal_dosen.create.mockResolvedValue(expectedReturn);

      const result = await service.addKegiatan('dosen123', dto);

      expect(prisma.jadwal_dosen.create).toHaveBeenCalled();
      expect(result).toEqual(expectedReturn);
    });

    it('should throw error when addKegiatan fails', async () => {
      prisma.jadwal_dosen.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.addKegiatan('dosen123', {
          kegiatan: 'Error',
          tanggal: '2025-01-01',
          jam_mulai: '09:00',
          jam_selesai: '10:00',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

 
  // GET BY MONTH
  describe('getKegiatanByMonthDosen', () => {
    it('should return kegiatan by month', async () => {
      const expected = [{ kegiatan: 'A' }];

      prisma.jadwal_dosen.findMany.mockResolvedValue(expected);

      const result = await service.getKegiatanByMonth('dosen1', 2025, 2);

      expect(prisma.jadwal_dosen.findMany).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it('should throw error on getKegiatanByMonth fail', async () => {
      prisma.jadwal_dosen.findMany.mockRejectedValue(new Error());

      await expect(service.getKegiatanByMonth('d', 2025, 2)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });


  // GET BY DATE
  describe('getKegiatanByDateDosen', () => {
    it('should return kegiatan by date', async () => {
      const expected = [{ kegiatan: 'B' }];

      prisma.jadwal_dosen.findMany.mockResolvedValue(expected);

      const result = await service.getKegiatanByDate('dosen1', '2025-02-15');

      expect(prisma.jadwal_dosen.findMany).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it('should throw error on getKegiatanByDate fail', async () => {
      prisma.jadwal_dosen.findMany.mockRejectedValue(new Error());

      await expect(
        service.getKegiatanByDate('dosen1', '2025-02-15'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });


  // DELETE KEGIATAN
  describe('deleteKegiatan', () => {
    it('should delete kegiatan successfully', async () => {
      prisma.jadwal_dosen.findUnique.mockResolvedValue({ jadwal_dosen_id: 'abc' });
      prisma.jadwal_dosen.delete.mockResolvedValue({});

      const result = await service.deleteKegiatan('abc');

      expect(prisma.jadwal_dosen.findUnique).toHaveBeenCalled();
      expect(prisma.jadwal_dosen.delete).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Kegiatan berhasil dihapus',
        jadwal_dosen_id: 'abc',
      });
    });

    it('should throw NotFoundException if kegiatan not found', async () => {
      prisma.jadwal_dosen.findUnique.mockResolvedValue(null);

      await expect(service.deleteKegiatan('xxx')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for other errors in delete', async () => {
      prisma.jadwal_dosen.findUnique.mockRejectedValue(new Error());

      await expect(service.deleteKegiatan('xxx')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });


  // GET BY BULAN (MAHASISWA)
  describe('getKegiatanByMonthMahasiswa', () => {
    it('should return kegiatan for mahasiswa by month', async () => {
      prisma.bimbingan.findFirst.mockResolvedValue({ dosen_id: 'dosen1' });
      prisma.jadwal_dosen.findMany.mockResolvedValue([{ kegiatan: 'C' }]);

      const result = await service.getKegiatanByBulan('mhs1', 2025, 2);

      expect(prisma.bimbingan.findFirst).toHaveBeenCalled();
      expect(prisma.jadwal_dosen.findMany).toHaveBeenCalled();
      expect(result).toEqual([{ kegiatan: 'C' }]);
    });

    it('should throw error on getKegiatanByBulan fail', async () => {
      prisma.bimbingan.findFirst.mockRejectedValue(new Error());

      await expect(service.getKegiatanByBulan('mhs1', 2025, 2)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });


  // GET BY TAHUN (MAHASISWA)
  describe('getKegiatanByTahunMahasiswa', () => {
    it('should return kegiatan by tahun for mahasiswa', async () => {
      prisma.bimbingan.findFirst.mockResolvedValue({ dosen_id: 'dosen1' });
      prisma.jadwal_dosen.findMany.mockResolvedValue([{ kegiatan: 'D' }]);

      const result = await service.getKegiatanByTahun('mhs1', '2025-02-20');

      expect(prisma.bimbingan.findFirst).toHaveBeenCalled();
      expect(prisma.jadwal_dosen.findMany).toHaveBeenCalled();
      expect(result).toEqual([{ kegiatan: 'D' }]);
    });

    it('should throw error on getKegiatanByTahun fail', async () => {
      prisma.bimbingan.findFirst.mockRejectedValue(new Error());

      await expect(service.getKegiatanByTahun('mhs', '2025-02-20')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});