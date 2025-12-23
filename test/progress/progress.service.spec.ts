import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from '../../src/progress/progress.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { addProgressOnlineDto } from '../../src/progress/dto/add-progress.dto';
import { KoreksiProgressDto } from '../../src/progress/dto/koreksi-progress.dto';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: any;
  let supabase: any;

  const prismaMock: any = {
    bimbingan: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    progress: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const supabaseMock: any = {
    uploadProgressFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SupabaseService, useValue: supabaseMock },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prisma = module.get<PrismaService>(PrismaService);
    supabase = module.get<SupabaseService>(SupabaseService);

    jest.clearAllMocks();
  });

  // ===============================================================
  // TEST: addProgressOnline()
  // ===============================================================
  describe('addProgressOnline', () => {
    it('should upload file & create progress records for each bimbingan', async () => {
      prisma.bimbingan.findMany.mockResolvedValue([
        { bimbingan_id: 'B1' },
        { bimbingan_id: 'B2' },
      ]);

      supabase.uploadProgressFile.mockResolvedValue({
        publicUrl: 'https://supabase/file.pdf',
        filename: 'file.pdf',
      });

      prisma.progress.createMany.mockResolvedValue({ count: 2 });

      const dto: addProgressOnlineDto = {
        subject_progress: 'BAB 1',
        note_mahasiswa: 'Sudah direvisi',
      };

      const file = {
        mimetype: 'application/pdf',
        originalname: 'file.pdf',
        buffer: Buffer.from('PDF FILE'),
      } as Express.Multer.File;

      const result = await service.addProgressOnline(dto, 'MHS1', file);

      expect(prisma.bimbingan.findMany).toHaveBeenCalledWith({
        where: { mahasiswa_id: 'MHS1' },
        select: { bimbingan_id: true },
      });

      expect(supabase.uploadProgressFile).toHaveBeenCalledWith(file);
      expect(prisma.progress.createMany).toHaveBeenCalled();
      expect(result).toEqual({ count: 2 });
    });

    it('should throw NotFoundException when bimbingan not found', async () => {
      prisma.bimbingan.findMany.mockResolvedValue([]);

      const dto: addProgressOnlineDto = {
        subject_progress: 'BAB 1',
        note_mahasiswa: 'Note',
      };

      const file = {
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      await expect(
        service.addProgressOnline(dto, 'MHS-NO', file),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when upload fails', async () => {
      prisma.bimbingan.findMany.mockResolvedValue([{ bimbingan_id: 'B1' }]);

      supabase.uploadProgressFile.mockRejectedValue(
        new Error('Upload failed'),
      );

      const dto = {
        subject_progress: 'BAB',
        note_mahasiswa: 'Note',
      };

      const file = {} as Express.Multer.File;

      await expect(
        service.addProgressOnline(dto, 'MHS1', file),
      ).rejects.toThrow('Upload failed');
    });

    it('should throw error when prisma.createMany fails', async () => {
      prisma.bimbingan.findMany.mockResolvedValue([{ bimbingan_id: 'B1' }]);

      supabase.uploadProgressFile.mockResolvedValue({
        publicUrl: 'xx',
        filename: 'yy',
      });

      prisma.progress.createMany.mockRejectedValue(
        new Error('DB error'),
      );

      const dto = {
        subject_progress: 'BAB',
        note_mahasiswa: 'Note',
      };

      const file = {} as Express.Multer.File;

      await expect(
        service.addProgressOnline(dto, 'MHS1', file),
      ).rejects.toThrow('DB error');
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      prisma.bimbingan.findMany.mockResolvedValue([{ bimbingan_id: 'B1' }]);
      supabase.uploadProgressFile.mockRejectedValue('String error');

      const dto = {
        subject_progress: 'BAB',
        note_mahasiswa: 'Note',
      };

      const file = {} as Express.Multer.File;

      await expect(
        service.addProgressOnline(dto, 'MHS1', file),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ===============================================================
  // TEST: allProgressOnline()
  // ===============================================================
  describe('allProgressOnline', () => {
    it('should return all progress for mahasiswa', async () => {
      prisma.bimbingan.findFirst.mockResolvedValue({ bimbingan_id: 'B1' });

      prisma.progress.findMany.mockResolvedValue([
        {
          subject_progress: 'BAB 1',
          submit_at: new Date('2024-12-01T10:00:00Z'),
          file_name: 'file.pdf',
          note_mahasiswa: 'Sudah diperbaiki',
          status_progress: 'unread',
        },
      ]);

      const result = await service.allProgressOnline('MHS1');

      expect(result).toEqual([
        {
          judul: 'BAB 1',
          tanggal: expect.any(String),
          jam: expect.any(String),
          namaFile: 'file.pdf',
          pesan: 'Sudah diperbaiki',
          status: 'unread',
        },
      ]);
    });

    it('should throw NotFoundException when bimbingan not found', async () => {
      prisma.bimbingan.findFirst.mockResolvedValue(null);

      await expect(
        service.allProgressOnline('MHS-NO'),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.allProgressOnline('MHS-NO'),
      ).rejects.toThrow('Bimbingan tidak ditemukan untuk mahasiswa ini');
    });

    it('should throw BadRequestException when caught in error handler', async () => {
      prisma.bimbingan.findFirst.mockResolvedValue({ bimbingan_id: 'B1' });

      const badRequestError = new BadRequestException('Bad request error');
      prisma.progress.findMany.mockRejectedValue(badRequestError);

      await expect(
        service.allProgressOnline('MHS1'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.allProgressOnline('MHS1'),
      ).rejects.toThrow('Bad request error');
    });

    it('should throw NotFoundException when caught in error handler', async () => {
      prisma.bimbingan.findFirst.mockResolvedValue({ bimbingan_id: 'B1' });

      const notFoundError = new NotFoundException('Not found error');
      prisma.progress.findMany.mockRejectedValue(notFoundError);

      await expect(
        service.allProgressOnline('MHS1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw original Error when it is an Error instance but not HTTP exception', async () => {
      prisma.bimbingan.findFirst.mockResolvedValue({ bimbingan_id: 'B1' });

      const genericError = new Error('Generic database error');
      prisma.progress.findMany.mockRejectedValue(genericError);

      await expect(
        service.allProgressOnline('MHS1'),
      ).rejects.toThrow('Generic database error');

      await expect(
        service.allProgressOnline('MHS1'),
      ).rejects.toThrow(Error);
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      prisma.bimbingan.findFirst.mockRejectedValue('String error');

      await expect(
        service.allProgressOnline('MHS1'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ===============================================================
  // TEST: progressOnlineMahasiswa()
  // ===============================================================
  describe('progressOnlineMahasiswa', () => {
    it('should return progress for dosen', async () => {
      prisma.bimbingan.findMany.mockResolvedValue([
        { bimbingan_id: 'B1' },
        { bimbingan_id: 'B2' },
      ]);

      prisma.progress.findMany.mockResolvedValue([
        {
          subject_progress: 'BAB 1',
          note_mahasiswa: 'Catatan',
          file_name: 'file.pdf',
          file_progress: 'https://url.com/file.pdf',
          status_progress: 'unread',
          bimbingan: {
            users_bimbingan_mahasiswa_idTousers: {
              user_id: 'MHS1',
              nama: 'Talitha',
            },
          },
        },
      ]);

      const result = await service.progressOnlineMahasiswa('DOSEN1');

      expect(result).toEqual([
        {
          nama: 'Talitha',
          nim: 'MHS1',
          judul: 'BAB 1',
          pesan: 'Catatan',
          status: 'unread',
          file_name: 'file.pdf',
          file_url: 'https://url.com/file.pdf',
        },
      ]);
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      prisma.bimbingan.findMany.mockRejectedValue('String error');

      await expect(
        service.progressOnlineMahasiswa('DOSEN1'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle database error', async () => {
      prisma.bimbingan.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        service.progressOnlineMahasiswa('DOSEN1'),
      ).rejects.toThrow('DB error');
    });
  });

  // ===============================================================
  // TEST: hitungPendingReview()
  // ===============================================================
  describe('hitungPendingReview', () => {
    it('should return count of pending reviews', async () => {
      prisma.bimbingan.findMany.mockResolvedValue([
        { bimbingan_id: 'B1' },
        { bimbingan_id: 'B2' },
      ]);

      prisma.progress.count.mockResolvedValue(5);

      const result = await service.hitungPendingReview('DOSEN1');

      expect(result).toEqual({ count: 5 });
      expect(prisma.progress.count).toHaveBeenCalledWith({
        where: {
          status_progress: { not: 'done' },
          jenis_bimbingan: 'online',
          bimbingan_id: { in: ['B1', 'B2'] },
        },
      });
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      prisma.bimbingan.findMany.mockRejectedValue('String error');

      await expect(
        service.hitungPendingReview('DOSEN1'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle database error', async () => {
      prisma.bimbingan.findMany.mockRejectedValue(new Error('DB error'));

      await expect(
        service.hitungPendingReview('DOSEN1'),
      ).rejects.toThrow('DB error');
    });
  });

  // ===============================================================
  // TEST: markAsRead()
  // ===============================================================
  describe('markAsRead', () => {
    it('should mark progress as read when status is unread', async () => {
      prisma.progress.findUnique.mockResolvedValue({
        progress_id: 'PROG1',
        status_progress: 'unread',
      });

      prisma.progress.update.mockResolvedValue({
        progress_id: 'PROG1',
        status_progress: 'read',
      });

      const result = await service.markAsRead('PROG1');

      expect(result).toEqual({
        status: 'success',
        message: 'Status progress berhasil diubah menjadi read',
      });

      expect(prisma.progress.update).toHaveBeenCalledWith({
        where: { progress_id: 'PROG1' },
        data: { status_progress: 'read' },
      });
    });

    it('should return success when status already read', async () => {
      prisma.progress.findUnique.mockResolvedValue({
        progress_id: 'PROG1',
        status_progress: 'read',
      });

      const result = await service.markAsRead('PROG1');

      expect(result).toEqual({
        status: 'success',
        message: 'Status progress sudah read',
      });

      expect(prisma.progress.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when progress not found', async () => {
      prisma.progress.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('PROG-INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException on other errors', async () => {
      prisma.progress.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.markAsRead('PROG1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ===============================================================
  // TEST: submitKoreksi()
  // ===============================================================
  describe('submitKoreksi', () => {
    it('should submit koreksi with status done', async () => {
      const mockProgress = {
        progress_id: 'PROG1',
        bimbingan_id: 'B1',
        subject_progress: 'BAB 1',
        file_koreksi: null,
        revisi_number: 0,
        bimbingan: {
          mahasiswa_id: 'MHS1',
          users_bimbingan_mahasiswa_idTousers: { nama: 'Talitha' },
        },
      };

      prisma.progress.findUnique.mockResolvedValue(mockProgress);

      prisma.progress.update.mockResolvedValue({
        ...mockProgress,
        status_progress: 'done',
        evaluasi_dosen: 'Bagus',
      });

      const dto: KoreksiProgressDto = {
        evaluasi_dosen: 'Bagus',
        status_progress: 'done' as any,
      };

      const result = await service.submitKoreksi('PROG1', dto);

      expect(result.status).toBe('success');
      expect(result.message).toBe('Progress berhasil disetujui');
      expect(prisma.progress.create).not.toHaveBeenCalled();
    });

    it('should submit koreksi with status need_revision and create new progress', async () => {
      const mockProgress = {
        progress_id: 'PROG1',
        bimbingan_id: 'B1',
        subject_progress: 'BAB 1',
        file_progress: 'https://url.com/file.pdf',
        file_name: 'file.pdf',
        file_koreksi: null,
        revisi_number: 0,
        bimbingan: {
          mahasiswa_id: 'MHS1',
          users_bimbingan_mahasiswa_idTousers: { nama: 'Talitha' },
        },
      };

      prisma.progress.findUnique.mockResolvedValue(mockProgress);

      supabase.uploadProgressFile.mockResolvedValue({
        publicUrl: 'https://url.com/koreksi.pdf',
        filename: 'koreksi.pdf',
      });

      prisma.progress.update.mockResolvedValue({
        ...mockProgress,
        status_progress: 'need_revision',
        evaluasi_dosen: 'Revisi bagian abstrak',
        file_koreksi: 'https://url.com/koreksi.pdf',
      });

      prisma.progress.create.mockResolvedValue({
        progress_id: 'PROG2',
        revisi_number: 1,
      });

      const dto: KoreksiProgressDto = {
        evaluasi_dosen: 'Revisi bagian abstrak',
        status_progress: 'need_revision' as any,
      };

      const file = {
        originalname: 'koreksi.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const result = await service.submitKoreksi('PROG1', dto, file);

      expect(result.status).toBe('success');
      expect(result.message).toBe('Koreksi berhasil dikirim');
      expect(prisma.progress.create).toHaveBeenCalled();

      // Verify the new progress creation with correct data
      expect(prisma.progress.create).toHaveBeenCalledWith({
        data: {
          progress_id: expect.stringContaining('PROG-MHS1-'),
          bimbingan_id: 'B1',
          subject_progress: 'Revisi 1: BAB 1',
          file_progress: 'https://url.com/file.pdf',
          file_name: 'file.pdf',
          submit_at: expect.any(Date),
          status_progress: 'unread',
          jenis_bimbingan: 'online',
          revisi_number: 1,
          parent_progress_id: 'PROG1',
        },
      });
    });

    it('should throw NotFoundException when progress not found', async () => {
      prisma.progress.findUnique.mockResolvedValue(null);

      const dto: KoreksiProgressDto = {
        evaluasi_dosen: 'Test',
        status_progress: 'done' as any,
      };

      await expect(service.submitKoreksi('PROG-INVALID', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when need_revision without file', async () => {
      const mockProgress = {
        progress_id: 'PROG1',
        status_progress: 'unread',
      };

      prisma.progress.findUnique.mockResolvedValue(mockProgress);

      const dto: KoreksiProgressDto = {
        evaluasi_dosen: 'Revisi',
        status_progress: 'need_revision' as any,
      };

      await expect(service.submitKoreksi('PROG1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException on other errors', async () => {
      prisma.progress.findUnique.mockRejectedValue(new Error('DB error'));

      const dto: KoreksiProgressDto = {
        evaluasi_dosen: 'Test',
        status_progress: 'done' as any,
      };

      await expect(service.submitKoreksi('PROG1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update with existing file_koreksi when no new file provided', async () => {
      const mockProgress = {
        progress_id: 'PROG1',
        bimbingan_id: 'B1',
        subject_progress: 'BAB 1',
        file_koreksi: 'https://url.com/old-koreksi.pdf',
        revisi_number: 0,
        bimbingan: {
          mahasiswa_id: 'MHS1',
          users_bimbingan_mahasiswa_idTousers: { nama: 'Talitha' },
        },
      };

      prisma.progress.findUnique.mockResolvedValue(mockProgress);

      prisma.progress.update.mockResolvedValue({
        ...mockProgress,
        status_progress: 'done',
        evaluasi_dosen: 'Selesai',
      });

      const dto: KoreksiProgressDto = {
        evaluasi_dosen: 'Selesai',
        status_progress: 'done' as any,
      };

      const result = await service.submitKoreksi('PROG1', dto);

      expect(result.status).toBe('success');
      expect(prisma.progress.update).toHaveBeenCalledWith({
        where: { progress_id: 'PROG1' },
        data: {
          evaluasi_dosen: 'Selesai',
          status_progress: 'done',
          file_koreksi: 'https://url.com/old-koreksi.pdf',
          koreksi_at: expect.any(Date),
        },
      });
    });
  });
});