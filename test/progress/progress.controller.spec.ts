import { Test, TestingModule } from '@nestjs/testing';
import { ProgressController } from '../../src/progress/progress.controller';
import { ProgressService } from '../../src/progress/progress.service';
import { addProgressOnlineDto } from '../../src/progress/dto/add-progress.dto';
import { KoreksiProgressDto } from '../../src/progress/dto/koreksi-progress.dto';
import { BadRequestException } from '@nestjs/common';

describe('ProgressController', () => {
  let controller: ProgressController;
  let progressService: ProgressService;

  const mockProgressService = {
    addProgressOnline: jest.fn(),
    allProgressOnline: jest.fn(),
    progressOnlineMahasiswa: jest.fn(),
    hitungPendingReview: jest.fn(),
    markAsRead: jest.fn(),
    submitKoreksi: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [
        {
          provide: ProgressService,
          useValue: mockProgressService,
        },
      ],
    }).compile();

    controller = module.get<ProgressController>(ProgressController);
    progressService = module.get<ProgressService>(ProgressService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addProgressOnline', () => {
    it('should call service.addProgressOnline with correct params', async () => {
      const dto: addProgressOnlineDto = {
        subject_progress: 'Bab 1',
        note_mahasiswa: 'Sudah saya perbaiki',
      };

      const mahasiswaId = '123';
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const serviceResult = { count: 1 };
      mockProgressService.addProgressOnline.mockResolvedValue(serviceResult);

      const result = await controller.addProgressOnline(dto, mahasiswaId, file);

      expect(result).toEqual(serviceResult);
      expect(mockProgressService.addProgressOnline).toHaveBeenCalledWith(
        dto,
        mahasiswaId,
        file
      );
    });

    it('should handle file upload error', async () => {
      const dto: addProgressOnlineDto = {
        subject_progress: 'Bab 1',
        note_mahasiswa: 'Note',
      };

      const mahasiswaId = '123';
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      mockProgressService.addProgressOnline.mockRejectedValue(
        new Error('Upload failed')
      );

      await expect(
        controller.addProgressOnline(dto, mahasiswaId, file)
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('allProgressOnline', () => {
    it('should return all progress for mahasiswa', async () => {
      const mahasiswaId = '123';
      const data = [{ judul: 'Progress A' }];

      mockProgressService.allProgressOnline.mockResolvedValue(data);

      expect(await controller.allProgressOnline(mahasiswaId)).toEqual(data);
      expect(mockProgressService.allProgressOnline).toHaveBeenCalledWith(mahasiswaId);
    });

    it('should handle error when fetching progress', async () => {
      const mahasiswaId = '123';

      mockProgressService.allProgressOnline.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        controller.allProgressOnline(mahasiswaId)
      ).rejects.toThrow('Database error');
    });
  });

  describe('progressOnlineMahasiswa', () => {
    it('should return progress for dosen view', async () => {
      const dosenId = '999';
      const data = [{ nama: 'Talitha', judul: 'Bab 1' }];

      mockProgressService.progressOnlineMahasiswa.mockResolvedValue(data);

      expect(await controller.progressOnlineMahasiswa(dosenId)).toEqual(data);
      expect(mockProgressService.progressOnlineMahasiswa).toHaveBeenCalledWith(dosenId);
    });

    it('should handle error when fetching dosen progress', async () => {
      const dosenId = '999';

      mockProgressService.progressOnlineMahasiswa.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        controller.progressOnlineMahasiswa(dosenId)
      ).rejects.toThrow('Database error');
    });
  });

  describe('hitungPendingReview', () => {
    it('should return pending review count', async () => {
      const dosenId = '555';
      const pending = { count: 7 };

      mockProgressService.hitungPendingReview.mockResolvedValue(pending);

      expect(await controller.hitungPendingReview(dosenId)).toEqual(pending);
      expect(mockProgressService.hitungPendingReview).toHaveBeenCalledWith(dosenId);
    });

    it('should handle error when counting pending', async () => {
      const dosenId = '555';

      mockProgressService.hitungPendingReview.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        controller.hitungPendingReview(dosenId)
      ).rejects.toThrow('Database error');
    });
  });

  describe('markAsRead', () => {
    it('should mark progress as read', async () => {
      const progressId = 'PROG-123';
      const result = { status: 'success', message: 'Status progress berhasil diubah menjadi read' };

      mockProgressService.markAsRead.mockResolvedValue(result);

      expect(await controller.markAsRead(progressId)).toEqual(result);
      expect(mockProgressService.markAsRead).toHaveBeenCalledWith(progressId);
    });

    it('should handle error when marking as read', async () => {
      const progressId = 'PROG-123';

      mockProgressService.markAsRead.mockRejectedValue(
        new Error('Progress not found')
      );

      await expect(
        controller.markAsRead(progressId)
      ).rejects.toThrow('Progress not found');
    });
  });

  describe('submitKoreksi', () => {
    it('should submit koreksi with file', async () => {
      const progressId = 'PROG-123';
      const dto: KoreksiProgressDto = {
        evaluasi_dosen: 'Bagus, lanjutkan',
        status_progress: 'done' as any,
      };
      const file = {
        originalname: 'koreksi.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const result = {
        status: 'success',
        message: 'Progress berhasil disetujui',
        data: {},
      };

      mockProgressService.submitKoreksi.mockResolvedValue(result);

      expect(await controller.submitKoreksi(progressId, dto, file)).toEqual(result);
      expect(mockProgressService.submitKoreksi).toHaveBeenCalledWith(
        progressId,
        dto,
        file
      );
    });

    it('should submit koreksi without file', async () => {
      const progressId = 'PROG-123';
      const dto: KoreksiProgressDto = {
        evaluasi_dosen: 'Revisi bagian abstrak',
        status_progress: 'need_revision' as any,
      };

      const result = {
        status: 'success',
        message: 'Koreksi berhasil dikirim',
        data: {},
      };

      mockProgressService.submitKoreksi.mockResolvedValue(result);

      expect(await controller.submitKoreksi(progressId, dto)).toEqual(result);
      expect(mockProgressService.submitKoreksi).toHaveBeenCalledWith(
        progressId,
        dto,
        undefined
      );
    });

    it('should handle error when submitting koreksi', async () => {
      const progressId = 'PROG-123';
      const dto: KoreksiProgressDto = {
        evaluasi_dosen: 'Test',
        status_progress: 'done' as any,
      };

      mockProgressService.submitKoreksi.mockRejectedValue(
        new BadRequestException('File koreksi wajib diupload untuk status revisi')
      );

      await expect(
        controller.submitKoreksi(progressId, dto)
      ).rejects.toThrow('File koreksi wajib diupload untuk status revisi');
    });
  });
});
