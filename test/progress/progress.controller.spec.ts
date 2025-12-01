import { Test, TestingModule } from '@nestjs/testing';
import { ProgressController } from '../../src/progress/progress.controller';
import { ProgressService } from '../../src/progress/progress.service';
import { addProgressOnlineDto } from '../../src/progress/dto/add-progress.dto';


describe('ProgressController', () => {
  let controller: ProgressController;
  let progressService: ProgressService;

  const mockProgressService = {
    addProgressOnline: jest.fn(),
    allProgressOnline: jest.fn(),
    progressOnlineMahasiswa: jest.fn(),
    hitungPendingReview: jest.fn(),
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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ================================
  // 1. TEST ADD PROGRESS
  // ================================
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
  });

  // ================================
  // 2. TEST GET ALL PROGRESS ONLINE MAHASISWA
  // ================================
  describe('allProgressOnline', () => {
    it('should return all progress for mahasiswa', async () => {
      const mahasiswaId = '123';
      const data = [{ judul: 'Progress A' }];

      mockProgressService.allProgressOnline.mockResolvedValue(data);

      expect(await controller.allProgressOnline(mahasiswaId)).toEqual(data);
      expect(mockProgressService.allProgressOnline).toHaveBeenCalledWith(mahasiswaId);
    });
  });

  // ================================
  // 3. TEST GET PROGRESS ONLINE UNTUK DOSEN
  // ================================
  describe('progressOnlineMahasiswa', () => {
    it('should return progress for dosen view', async () => {
      const dosenId = '999';
      const data = [{ nama: 'Talitha', judul: 'Bab 1' }];

      mockProgressService.progressOnlineMahasiswa.mockResolvedValue(data);

      expect(await controller.progressOnlineMahasiswa(dosenId)).toEqual(data);
      expect(mockProgressService.progressOnlineMahasiswa).toHaveBeenCalledWith(dosenId);
    });
  });

  // ================================
  // 4. TEST HITUNG PENDING REVIEW
  // ================================
  describe('hitungPendingReview', () => {
    it('should return pending review count', async () => {
      const dosenId = '555';
      const pending = 7;

      mockProgressService.hitungPendingReview.mockResolvedValue(pending);

      expect(await controller.hitungPendingReview(dosenId)).toBe(pending);
      expect(mockProgressService.hitungPendingReview).toHaveBeenCalledWith(dosenId);
    });
  });
});
