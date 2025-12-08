import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from '../../src/progress/progress.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { addProgressOnlineDto } from '../../src/progress/dto/add-progress.dto';
import { status_progress_enum, jenis_bimbingan_enum } from '@prisma/client';

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
      count: jest.fn(),
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
  // TEST : addProgressOnline()
  // ===============================================================
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

    expect(prisma.bimbingan.findMany).toHaveBeenCalled();

    expect(supabase.uploadProgressFile).toHaveBeenCalledWith(file);

    expect(prisma.progress.createMany).toHaveBeenCalled();

    expect(result).toEqual({ count: 2 });
  });

  it('should throw error when bimbingan not found', async () => {
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
    ).rejects.toThrow('Bimbingan tidak ditemukan untuk mahasiswa ini');
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
});
