import { Test, TestingModule } from '@nestjs/testing';
import { GeneralService } from '../../src/general/general.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { status_jadwal_enum, status_progress_enum } from '@prisma/client';
import { InternalServerErrorException } from '@nestjs/common';

describe('GeneralService', () => {
  let service: GeneralService;
  let prisma: PrismaService;

  const prismaMock: any = {
    referensi_ta: {
      findMany: jest.fn(),
    },
    users: {
      findMany: jest.fn(),
    },
    bimbingan: {
      findMany: jest.fn(),
    },
    progress: {
      findMany: jest.fn(),
    },
    jadwal: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeneralService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<GeneralService>(GeneralService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('referensiTa', () => {
    it('should return all referensi TA', async () => {
      const mockReferensi = [
        {
          nim_mahasiswa: '2111522001',
          nama_mahasiswa: 'Ahmad Hidayat',
          topik: 'Machine Learning',
          judul: 'Implementasi ML',
          tahun: 2023,
          doc_url: 'https://github.com'
        }
      ];
      (prisma.referensi_ta.findMany as jest.Mock).mockResolvedValue(mockReferensi);

      const result = await service.referensiTa();

      expect(result).toEqual(mockReferensi);
      expect(prisma.referensi_ta.findMany).toHaveBeenCalledWith({
        select: {
          nim_mahasiswa: true,
          nama_mahasiswa: true,
          topik: true,
          judul: true,
          tahun: true,
          doc_url: true
        }
      });
    });

    it('should return empty array when no referensi TA', async () => {
      (prisma.referensi_ta.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.referensiTa();

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on non-Error exception', async () => {
      (prisma.referensi_ta.findMany as jest.Mock).mockRejectedValue('String error');

      await expect(service.referensiTa()).rejects.toThrow(InternalServerErrorException);
      await expect(service.referensiTa()).rejects.toThrow('Terjadi kesalahan pada server');
    });

    it('should throw original error when Error instance', async () => {
      const error = new Error('Database connection failed');
      (prisma.referensi_ta.findMany as jest.Mock).mockRejectedValue(error);

      await expect(service.referensiTa()).rejects.toThrow('Database connection failed');
    });
  });

  describe('mahasiswa', () => {
    it('should return mahasiswa without bimbingan from specific dosen', async () => {
      const mockMahasiswa = [
        { user_id: '2211522009', nama: 'ramadhani safitri' }
      ];
      (prisma.users.findMany as jest.Mock).mockResolvedValue(mockMahasiswa);

      const result = await service.mahasiswa('0909090909');

      expect(result).toEqual(mockMahasiswa);
      expect(prisma.users.findMany).toHaveBeenCalledWith({
        where: {
          role: 'mahasiswa',
          NOT: {
            bimbingan_bimbingan_mahasiswa_idTousers: {
              some: {
                dosen_id: '0909090909'
              }
            }
          }
        },
        select: {
          user_id: true,
          nama: true
        }
      });
    });

    it('should return empty array when all mahasiswa have bimbingan', async () => {
      (prisma.users.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.mahasiswa('0909090909');

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on non-Error exception', async () => {
      (prisma.users.findMany as jest.Mock).mockRejectedValue('String error');

      await expect(service.mahasiswa('0909090909')).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw original error when Error instance', async () => {
      const error = new Error('Query failed');
      (prisma.users.findMany as jest.Mock).mockRejectedValue(error);

      await expect(service.mahasiswa('0909090909')).rejects.toThrow('Query failed');
    });
  });

  describe('terkiniMahasiswa', () => {
    it('should return merged and sorted activities', async () => {
      const mockBimbingan = [{ bimbingan_id: 'BIMB1' }];
      const mockProgress = [
        {
          progress_id: 'prog-001',
          subject_progress: 'BAB I',
          koreksi_at: new Date('2024-01-16T14:00:00Z')
        }
      ];
      const mockJadwal = [
        {
          bimbingan_id: 'BIMB1',
          judul_pertemuan: 'Bimbingan BAB III',
          datetime: new Date('2024-01-25T09:00:00Z')
        }
      ];

      (prisma.bimbingan.findMany as jest.Mock).mockResolvedValue(mockBimbingan);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue(mockProgress);
      (prisma.jadwal.findMany as jest.Mock).mockResolvedValue(mockJadwal);

      const result = await service.terkiniMahasiswa('2211522023');

      expect(result).toHaveLength(2);
      expect(result[0].nama).toBe('Bimbingan BAB III');
      expect(result[0].icon).toBe('jadwal');
      expect(result[1].nama).toBe('BAB I');
      expect(result[1].icon).toBe('progress');
      
      
      expect(new Date(result[0].tanggal!).getTime()).toBeGreaterThan(
        new Date(result[1].tanggal!).getTime()
      );
    });

    it('should only include progress with need_revision status', async () => {
      const mockBimbingan = [{ bimbingan_id: 'BIMB1' }];
      (prisma.bimbingan.findMany as jest.Mock).mockResolvedValue(mockBimbingan);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jadwal.findMany as jest.Mock).mockResolvedValue([]);

      await service.terkiniMahasiswa('2211522023');

      expect(prisma.progress.findMany).toHaveBeenCalledWith({
        where: {
          bimbingan_id: {
            in: ['BIMB1']
          },
          status_progress: status_progress_enum.need_revision
        },
        select: {
          subject_progress: true,
          koreksi_at: true,
          progress_id: true
        }
      });
    });

    it('should only include jadwal with accepted status', async () => {
      const mockBimbingan = [{ bimbingan_id: 'BIMB1' }];
      (prisma.bimbingan.findMany as jest.Mock).mockResolvedValue(mockBimbingan);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jadwal.findMany as jest.Mock).mockResolvedValue([]);

      await service.terkiniMahasiswa('2211522023');

      expect(prisma.jadwal.findMany).toHaveBeenCalledWith({
        where: {
          bimbingan_id: {
            in: ['BIMB1']
          },
          status_jadwal: status_jadwal_enum.accepted
        },
        select: {
          judul_pertemuan: true,
          datetime: true,
          bimbingan_id: true
        }
      });
    });

    it('should return empty array when no bimbingan found', async () => {
      (prisma.bimbingan.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jadwal.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.terkiniMahasiswa('2211522023');

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException on non-Error exception', async () => {
      (prisma.bimbingan.findMany as jest.Mock).mockRejectedValue('String error');

      await expect(service.terkiniMahasiswa('2211522023')).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw original error when Error instance', async () => {
      const error = new Error('Query failed');
      (prisma.bimbingan.findMany as jest.Mock).mockRejectedValue(error);

      await expect(service.terkiniMahasiswa('2211522023')).rejects.toThrow('Query failed');
    });
  });

  describe('terkiniDosen', () => {
    it('should return merged and sorted activities', async () => {
      const mockBimbingan = [{ bimbingan_id: 'BIMB1' }];
      const mockProgress = [
        {
          progress_id: 'prog-002',
          subject_progress: 'BAB II',
          submit_at: new Date('2024-01-20T10:00:00Z')
        }
      ];
      const mockJadwal = [
        {
          bimbingan_id: 'BIMB1',
          judul_pertemuan: 'Bimbingan BAB IV',
          datetime: new Date('2024-01-30T14:00:00Z')
        }
      ];

      (prisma.bimbingan.findMany as jest.Mock).mockResolvedValue(mockBimbingan);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue(mockProgress);
      (prisma.jadwal.findMany as jest.Mock).mockResolvedValue(mockJadwal);

      const result = await service.terkiniDosen('0909090909');

      expect(result).toHaveLength(2);
      expect(result[0].nama).toBe('Bimbingan BAB IV');
      expect(result[0].icon).toBe('jadwal');
      expect(result[1].nama).toBe('BAB II');
      expect(result[1].icon).toBe('progress');
      
      
      expect(new Date(result[0].tanggal).getTime()).toBeGreaterThan(
        new Date(result[1].tanggal).getTime()
      );
    });

    it('should only include progress with unread and read status', async () => {
      const mockBimbingan = [{ bimbingan_id: 'BIMB1' }];
      (prisma.bimbingan.findMany as jest.Mock).mockResolvedValue(mockBimbingan);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jadwal.findMany as jest.Mock).mockResolvedValue([]);

      await service.terkiniDosen('0909090909');

      expect(prisma.progress.findMany).toHaveBeenCalledWith({
        where: {
          bimbingan_id: {
            in: ['BIMB1']
          },
          status_progress: {
            in: [status_progress_enum.unread, status_progress_enum.read]
          }
        },
        select: {
          subject_progress: true,
          submit_at: true,
          progress_id: true
        }
      });
    });

    it('should only include jadwal with waiting and accepted status', async () => {
      const mockBimbingan = [{ bimbingan_id: 'BIMB1' }];
      (prisma.bimbingan.findMany as jest.Mock).mockResolvedValue(mockBimbingan);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jadwal.findMany as jest.Mock).mockResolvedValue([]);

      await service.terkiniDosen('0909090909');

      expect(prisma.jadwal.findMany).toHaveBeenCalledWith({
        where: {
          bimbingan_id: {
            in: ['BIMB1']
          },
          status_jadwal: {
            in: [status_jadwal_enum.waiting, status_jadwal_enum.accepted]
          }
        },
        select: {
          judul_pertemuan: true,
          datetime: true,
          bimbingan_id: true
        }
      });
    });

    it('should return empty array when no bimbingan found', async () => {
      (prisma.bimbingan.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jadwal.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.terkiniDosen('0909090909');

      expect(result).toEqual([]);
    });

    it('should handle multiple bimbingan correctly', async () => {
      const mockBimbingan = [
        { bimbingan_id: 'BIMB1' },
        { bimbingan_id: 'BIMB2' }
      ];
      const mockProgress = [
        {
          progress_id: 'prog-001',
          subject_progress: 'Progress 1',
          submit_at: new Date('2024-01-20T10:00:00Z')
        },
        {
          progress_id: 'prog-002',
          subject_progress: 'Progress 2',
          submit_at: new Date('2024-01-21T10:00:00Z')
        }
      ];

      (prisma.bimbingan.findMany as jest.Mock).mockResolvedValue(mockBimbingan);
      (prisma.progress.findMany as jest.Mock).mockResolvedValue(mockProgress);
      (prisma.jadwal.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.terkiniDosen('0909090909');

      expect(result).toHaveLength(2);
      expect(prisma.progress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            bimbingan_id: {
              in: ['BIMB1', 'BIMB2']
            }
          })
        })
      );
    });

    it('should throw InternalServerErrorException on non-Error exception', async () => {
      (prisma.bimbingan.findMany as jest.Mock).mockRejectedValue('String error');

      await expect(service.terkiniDosen('0909090909')).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw original error when Error instance', async () => {
      const error = new Error('Query failed');
      (prisma.bimbingan.findMany as jest.Mock).mockRejectedValue(error);

      await expect(service.terkiniDosen('0909090909')).rejects.toThrow('Query failed');
    });
  });
});