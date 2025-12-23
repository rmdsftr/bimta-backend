import { Test, TestingModule } from '@nestjs/testing';
import { RiwayatService } from '../../src/riwayat/riwayat.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('RiwayatService - Complete Branch Coverage', () => {
  let service: RiwayatService;
  let prisma: PrismaService;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
    },
    bimbingan: {
      findFirst: jest.fn(),
    },
    jadwal: {
      findMany: jest.fn(),
    },
    progress: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiwayatService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RiwayatService>(RiwayatService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('riwayatBimbingan - Success Cases', () => {
    it('should return combined offline and online riwayat sorted by date', async () => {
      const mahasiswa_id = '123';

      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: mahasiswa_id,
        nama: 'Test User',
      });

      mockPrismaService.bimbingan.findFirst.mockResolvedValue({
        bimbingan_id: 'bimb1',
      });

      mockPrismaService.jadwal.findMany.mockResolvedValue([
        {
          datetime: new Date('2024-01-15T10:00:00'),
          judul_pertemuan: 'Pertemuan 1',
          note_dosen: 'Bagus',
          bimbingan_id: 'bimb1',
        },
      ]);

      mockPrismaService.progress.findMany.mockResolvedValue([
        {
          submit_at: new Date('2024-01-10T10:00:00'),
          subject_progress: 'Progress 1',
          evaluasi_dosen: 'Good',
          progress_id: 'prog1',
        },
      ]);

      const result = await service.riwayatBimbingan(mahasiswa_id);

      expect(result).toHaveLength(2);
      expect(result[0].jenis).toBe('online');
      expect(result[1].jenis).toBe('offline');
    });

    it('should handle empty riwayat', async () => {
      const mahasiswa_id = '123';

      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: mahasiswa_id,
      });

      mockPrismaService.bimbingan.findFirst.mockResolvedValue(null);
      mockPrismaService.jadwal.findMany.mockResolvedValue([]);
      mockPrismaService.progress.findMany.mockResolvedValue([]);

      const result = await service.riwayatBimbingan(mahasiswa_id);
      expect(result).toEqual([]);
    });
  });

  describe('riwayatBimbingan - Complete Error Branches (LINE 8)', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    // Test 1: Error yang bukan instance of Error - STRING
    it('should handle string error and throw InternalServerErrorException', async () => {
      const mahasiswa_id = '123';
      const stringError = 'String error message';

      mockPrismaService.users.findUnique.mockRejectedValue(stringError);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        'Terjadi kesalahan pada server'
      );

      expect(consoleSpy).toHaveBeenCalledWith(stringError);
    });

    // Test 2: Error yang bukan instance of Error - NUMBER
    it('should handle number error', async () => {
      const mahasiswa_id = '123';
      const numberError = 500;

      mockPrismaService.users.findUnique.mockRejectedValue(numberError);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        InternalServerErrorException
      );

      expect(consoleSpy).toHaveBeenCalledWith(numberError);
    });

    // Test 3: Error yang bukan instance of Error - OBJECT
    it('should handle plain object error', async () => {
      const mahasiswa_id = '123';
      const objectError = { code: 'P2002', meta: { target: ['user_id'] } };

      mockPrismaService.users.findUnique.mockRejectedValue(objectError);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        InternalServerErrorException
      );

      expect(consoleSpy).toHaveBeenCalledWith(objectError);
    });

    // Test 4: Error yang bukan instance of Error - NULL
    it('should handle null error', async () => {
      const mahasiswa_id = '123';

      mockPrismaService.users.findUnique.mockRejectedValue(null);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        InternalServerErrorException
      );

      expect(consoleSpy).toHaveBeenCalledWith(null);
    });

    // Test 5: Error yang bukan instance of Error - UNDEFINED
    it('should handle undefined error', async () => {
      const mahasiswa_id = '123';

      mockPrismaService.users.findUnique.mockRejectedValue(undefined);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        InternalServerErrorException
      );

      expect(consoleSpy).toHaveBeenCalledWith(undefined);
    });

    // Test 6: Error yang ADALAH instance of Error - standard Error
    it('should re-throw standard Error instance', async () => {
      const mahasiswa_id = '123';
      const standardError = new Error('Standard error message');

      mockPrismaService.users.findUnique.mockRejectedValue(standardError);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        standardError
      );
      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        'Standard error message'
      );

      expect(consoleSpy).toHaveBeenCalledWith(standardError);
    });

    // Test 7: Error yang ADALAH instance of Error - NotFoundException
    it('should re-throw NotFoundException (extends Error)', async () => {
      const mahasiswa_id = '999';

      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        'Mahasiswa tidak ditemukan'
      );

      expect(consoleSpy).toHaveBeenCalled();
    });

    // Test 8: Error yang ADALAH instance of Error - Custom Error
    it('should re-throw custom Error subclass', async () => {
      const mahasiswa_id = '123';
      
      class CustomDatabaseError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomDatabaseError';
        }
      }

      const customError = new CustomDatabaseError('Custom DB error');

      mockPrismaService.users.findUnique.mockRejectedValue(customError);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        customError
      );

      expect(consoleSpy).toHaveBeenCalledWith(customError);
    });

    // Test 9: Error yang ADALAH instance of Error - TypeError
    it('should re-throw TypeError instance', async () => {
      const mahasiswa_id = '123';
      const typeError = new TypeError('Cannot read property');

      mockPrismaService.users.findUnique.mockRejectedValue(typeError);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        typeError
      );

      expect(consoleSpy).toHaveBeenCalledWith(typeError);
    });

    // Test 10: Error yang ADALAH instance of Error - ReferenceError
    it('should re-throw ReferenceError instance', async () => {
      const mahasiswa_id = '123';
      const refError = new ReferenceError('Variable not defined');

      mockPrismaService.users.findUnique.mockRejectedValue(refError);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        refError
      );

      expect(consoleSpy).toHaveBeenCalledWith(refError);
    });

    // Test 11: Boolean error
    it('should handle boolean error', async () => {
      const mahasiswa_id = '123';

      mockPrismaService.users.findUnique.mockRejectedValue(false);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        InternalServerErrorException
      );

      expect(consoleSpy).toHaveBeenCalledWith(false);
    });

    // Test 12: Array error
    it('should handle array error', async () => {
      const mahasiswa_id = '123';
      const arrayError = ['error1', 'error2'];

      mockPrismaService.users.findUnique.mockRejectedValue(arrayError);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        InternalServerErrorException
      );

      expect(consoleSpy).toHaveBeenCalledWith(arrayError);
    });

    // Test 13: Error at different stages - during bimbingan.findFirst
    it('should handle error during bimbingan.findFirst', async () => {
      const mahasiswa_id = '123';
      const dbError = new Error('Database query failed');

      mockPrismaService.users.findUnique.mockResolvedValue({ user_id: mahasiswa_id });
      mockPrismaService.bimbingan.findFirst.mockRejectedValue(dbError);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(dbError);
      expect(consoleSpy).toHaveBeenCalledWith(dbError);
    });

    // Test 14: Error during jadwal.findMany
    it('should handle error during jadwal.findMany', async () => {
      const mahasiswa_id = '123';
      const dbError = new Error('Jadwal query failed');

      mockPrismaService.users.findUnique.mockResolvedValue({ user_id: mahasiswa_id });
      mockPrismaService.bimbingan.findFirst.mockResolvedValue({ bimbingan_id: 'bimb1' });
      mockPrismaService.jadwal.findMany.mockRejectedValue(dbError);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(dbError);
      expect(consoleSpy).toHaveBeenCalledWith(dbError);
    });

    // Test 15: Error during progress.findMany
    it('should handle error during progress.findMany', async () => {
      const mahasiswa_id = '123';
      const dbError = new Error('Progress query failed');

      mockPrismaService.users.findUnique.mockResolvedValue({ user_id: mahasiswa_id });
      mockPrismaService.bimbingan.findFirst.mockResolvedValue({ bimbingan_id: 'bimb1' });
      mockPrismaService.jadwal.findMany.mockResolvedValue([]);
      mockPrismaService.progress.findMany.mockRejectedValue(dbError);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(dbError);
      expect(consoleSpy).toHaveBeenCalledWith(dbError);
    });
  });

  describe('mahasiswa not found (LINE 19)', () => {
    it('should throw NotFoundException when mahasiswa does not exist', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mahasiswa_id = '999';

      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.riwayatBimbingan(mahasiswa_id)).rejects.toThrow(
        'Mahasiswa tidak ditemukan'
      );

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});