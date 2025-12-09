import { Test, TestingModule } from '@nestjs/testing';
import { RiwayatService } from '../../src/riwayat/riwayat.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { jenis_bimbingan_enum, status_jadwal_enum, status_progress_enum } from '@prisma/client';

describe('RiwayatService', () => {
  let service: RiwayatService;
  let prisma: PrismaService;

  const prismaMock: any = {
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
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<RiwayatService>(RiwayatService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
    
    
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return merged and sorted riwayat bimbingan', async () => {
    
    (prisma.users.findUnique as jest.Mock).mockResolvedValue({
      user_id: 'MHS1',
      nama: 'Test Mahasiswa'
    });

    (prisma.bimbingan.findFirst as jest.Mock).mockResolvedValue({
      bimbingan_id: 'BIMB1',
    });

    (prisma.jadwal.findMany as jest.Mock).mockResolvedValue([
      {
        datetime: new Date('2025-01-01'),
        judul_pertemuan: 'Pertemuan 1',
        note_dosen: 'Catatan Dosen',
        bimbingan_id: 'BIMB1',
      },
    ]);

    (prisma.progress.findMany as jest.Mock).mockResolvedValue([
      {
        submit_at: new Date('2025-01-02'),
        subject_progress: 'Subjek Progress',
        evaluasi_dosen: 'Evaluasi',
        progress_id: 'PRG1',
      },
    ]);

    const result = await service.riwayatBimbingan('MHS1');

    expect(result).toHaveLength(2);
    expect(result[0].jenis).toBe(jenis_bimbingan_enum.offline);
    expect(result[1].jenis).toBe(jenis_bimbingan_enum.online);

    expect(result[0].tanggal < result[1].tanggal).toBe(true);
  });

  it('should return empty array if no bimbingan found', async () => {
    
    (prisma.users.findUnique as jest.Mock).mockResolvedValue({
      user_id: 'MHS-NO',
      nama: 'Test Mahasiswa'
    });

    (prisma.bimbingan.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.jadwal.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.progress.findMany as jest.Mock).mockResolvedValue([]);

    const result = await service.riwayatBimbingan('MHS-NO');
    expect(result).toEqual([]);
  });

  it('should throw error when prisma throws', async () => {
    (prisma.users.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await expect(service.riwayatBimbingan('X')).rejects.toThrow('DB Error');
  });
});