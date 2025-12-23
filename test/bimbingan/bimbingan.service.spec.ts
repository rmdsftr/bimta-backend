import { Test, TestingModule } from '@nestjs/testing';
import { BimbinganService } from '../../src/bimbingan/bimbingan.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { status_bimbingan_enum } from '@prisma/client';

describe('BimbinganService - Complete Coverage', () => {
  let service: BimbinganService;
  let prisma: PrismaService;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    bimbingan: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    progress: {
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    jadwal: {
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BimbinganService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BimbinganService>(BimbinganService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('mahasiswaDibimbing', () => {
    const dosenId = 'dosen-1';

    it('should return list of mahasiswa dibimbing', async () => {
      const mockDosen = { user_id: dosenId };
      const mockMahasiswa = [
        {
          status_bimbingan: status_bimbingan_enum.ongoing,
          users_bimbingan_mahasiswa_idTousers: {
            user_id: 'mhs-1',
            nama: 'Mahasiswa 1',
            judul: 'Judul TA',
            photo_url: 'photo.jpg',
          },
        },
      ];

      mockPrismaService.users.findUnique.mockResolvedValue(mockDosen);
      mockPrismaService.bimbingan.findMany.mockResolvedValue(mockMahasiswa);

      const result = await service.mahasiswaDibimbing(dosenId);

      expect(result).toEqual(mockMahasiswa);
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { user_id: dosenId },
        select: { user_id: true },
      });
    });

    it('should throw NotFoundException when dosen not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.mahasiswaDibimbing(dosenId)).rejects.toThrow(
        NotFoundException,
      );
    });

    // LINE 52: Test InternalServerErrorException
    it('should throw InternalServerErrorException on database error', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.mahasiswaDibimbing(dosenId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('addMahasiswa', () => {
    const dto = {
      dosen_id: 'dosen-1',
      mahasiswa_id: ['mhs-1', 'mhs-2'],
    };

    it('should successfully add mahasiswa to bimbingan', async () => {
      const mockDosen = {
        user_id: dto.dosen_id,
        role: 'dosen',
        status_user: 'active',
      };
      const mockMahasiswa = [
        { user_id: 'mhs-1', role: 'mahasiswa', status_user: 'active' },
        { user_id: 'mhs-2', role: 'mahasiswa', status_user: 'active' },
      ];

      mockPrismaService.users.findUnique.mockResolvedValue(mockDosen);
      mockPrismaService.users.findMany.mockResolvedValue(mockMahasiswa);
      mockPrismaService.bimbingan.findMany.mockResolvedValue([]);
      mockPrismaService.bimbingan.createMany.mockResolvedValue({ count: 2 });

      const result = await service.addMahasiswa(dto);

      expect(result).toEqual({ success: true });
    });

    it('should throw BadRequestException for empty dosen_id', async () => {
      await expect(
        service.addMahasiswa({ dosen_id: '', mahasiswa_id: ['mhs-1'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for whitespace-only dosen_id', async () => {
      await expect(
        service.addMahasiswa({ dosen_id: '   ', mahasiswa_id: ['mhs-1'] }),
      ).rejects.toThrow(BadRequestException);
    });

    // LINE 72: Test non-array mahasiswa_id
    it('should throw BadRequestException when mahasiswa_id is not an array', async () => {
      await expect(
        service.addMahasiswa({
          dosen_id: 'dosen-1',
          mahasiswa_id: 'not-an-array' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty mahasiswa_id array', async () => {
      await expect(
        service.addMahasiswa({ dosen_id: 'dosen-1', mahasiswa_id: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should filter out invalid mahasiswa_id entries', async () => {
      await expect(
        service.addMahasiswa({
          dosen_id: 'dosen-1',
          mahasiswa_id: ['', '   ', null as any, undefined as any],
        }),
      ).rejects.toThrow('Tidak ada ID mahasiswa yang valid');
    });

    it('should throw NotFoundException when dosen not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.addMahasiswa(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user is not dosen', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: dto.dosen_id,
        role: 'mahasiswa',
        status_user: 'active',
      });

      await expect(service.addMahasiswa(dto)).rejects.toThrow(
        'User bukan dosen',
      );
    });

    it('should throw BadRequestException when dosen is not active', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: dto.dosen_id,
        role: 'dosen',
        status_user: 'inactive',
      });

      await expect(service.addMahasiswa(dto)).rejects.toThrow(
        'Dosen tidak aktif',
      );
    });

    it('should throw NotFoundException when some mahasiswa not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: dto.dosen_id,
        role: 'dosen',
        status_user: 'active',
      });
      mockPrismaService.users.findMany.mockResolvedValue([
        { user_id: 'mhs-1', role: 'mahasiswa', status_user: 'active' },
      ]);

      await expect(service.addMahasiswa(dto)).rejects.toThrow(
        'Mahasiswa tidak ditemukan',
      );
    });

    // LINE 121-122: Test non-mahasiswa role
    it('should throw BadRequestException when user is not mahasiswa', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: dto.dosen_id,
        role: 'dosen',
        status_user: 'active',
      });
      mockPrismaService.users.findMany.mockResolvedValue([
        { user_id: 'mhs-1', role: 'dosen', status_user: 'active' },
        { user_id: 'mhs-2', role: 'admin', status_user: 'active' },
      ]);

      await expect(service.addMahasiswa(dto)).rejects.toThrow(
        'User bukan mahasiswa',
      );
    });

    // LINE 129-130: Test inactive mahasiswa
    it('should throw BadRequestException when mahasiswa is not active', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: dto.dosen_id,
        role: 'dosen',
        status_user: 'active',
      });
      mockPrismaService.users.findMany.mockResolvedValue([
        { user_id: 'mhs-1', role: 'mahasiswa', status_user: 'inactive' },
        { user_id: 'mhs-2', role: 'mahasiswa', status_user: 'suspended' },
      ]);

      await expect(service.addMahasiswa(dto)).rejects.toThrow(
        'Mahasiswa tidak aktif',
      );
    });

    it('should throw ConflictException when mahasiswa already registered', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: dto.dosen_id,
        role: 'dosen',
        status_user: 'active',
      });
      mockPrismaService.users.findMany.mockResolvedValue([
        { user_id: 'mhs-1', role: 'mahasiswa', status_user: 'active' },
        { user_id: 'mhs-2', role: 'mahasiswa', status_user: 'active' },
      ]);
      mockPrismaService.bimbingan.findMany.mockResolvedValue([
        { mahasiswa_id: 'mhs-1', status_bimbingan: status_bimbingan_enum.ongoing },
      ]);

      await expect(service.addMahasiswa(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should handle duplicate mahasiswa_id in input', async () => {
      const dtoWithDuplicates = {
        dosen_id: 'dosen-1',
        mahasiswa_id: ['mhs-1', 'mhs-1', 'mhs-2'],
      };

      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: dtoWithDuplicates.dosen_id,
        role: 'dosen',
        status_user: 'active',
      });
      mockPrismaService.users.findMany.mockResolvedValue([
        { user_id: 'mhs-1', role: 'mahasiswa', status_user: 'active' },
        { user_id: 'mhs-2', role: 'mahasiswa', status_user: 'active' },
      ]);
      mockPrismaService.bimbingan.findMany.mockResolvedValue([]);
      mockPrismaService.bimbingan.createMany.mockResolvedValue({ count: 2 });

      const result = await service.addMahasiswa(dtoWithDuplicates);

      expect(result).toEqual({ success: true });
      expect(prisma.bimbingan.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ mahasiswa_id: 'mhs-1' }),
          expect.objectContaining({ mahasiswa_id: 'mhs-2' }),
        ]),
        skipDuplicates: true,
      });
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.addMahasiswa(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('dosenPembimbing', () => {
    const mahasiswaId = 'mhs-1';

    it('should return list of dosen pembimbing', async () => {
      const mockMahasiswa = {
        user_id: mahasiswaId,
        role: 'mahasiswa',
      };
      const mockDosen = [
        {
          users_bimbingan_dosen_idTousers: {
            nama: 'Dosen 1',
          },
        },
      ];

      mockPrismaService.users.findUnique.mockResolvedValue(mockMahasiswa);
      mockPrismaService.bimbingan.findMany.mockResolvedValue(mockDosen);

      const result = await service.dosenPembimbing(mahasiswaId);

      expect(result).toEqual(mockDosen);
    });

    it('should throw BadRequestException for empty mahasiswa_id', async () => {
      await expect(service.dosenPembimbing('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when mahasiswa not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.dosenPembimbing(mahasiswaId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user is not mahasiswa', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: mahasiswaId,
        role: 'dosen',
      });

      await expect(service.dosenPembimbing(mahasiswaId)).rejects.toThrow(
        'User bukan mahasiswa',
      );
    });

    // LINE 172: Test InternalServerErrorException
    it('should throw InternalServerErrorException on database error', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.dosenPembimbing(mahasiswaId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('jumlahMahasiswaBimbingan', () => {
    const dosenId = 'dosen-1';

    it('should return count of mahasiswa bimbingan', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: dosenId,
        role: 'dosen',
      });
      mockPrismaService.bimbingan.count.mockResolvedValue(5);

      const result = await service.jumlahMahasiswaBimbingan(dosenId);

      expect(result).toBe(5);
    });

    it('should throw BadRequestException for empty dosen_id', async () => {
      await expect(service.jumlahMahasiswaBimbingan('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when dosen not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.jumlahMahasiswaBimbingan(dosenId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user is not dosen', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: dosenId,
        role: 'mahasiswa',
      });

      await expect(service.jumlahMahasiswaBimbingan(dosenId)).rejects.toThrow(
        'User bukan dosen',
      );
    });

    // LINE 219: Test InternalServerErrorException
    it('should throw InternalServerErrorException on database error', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.jumlahMahasiswaBimbingan(dosenId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('hapusMahasiswaBimbingan', () => {
    const dosenId = 'dosen-1';
    const mahasiswaId = 'mhs-1';
    const bimbinganId = `${dosenId}-${mahasiswaId}`;

    it('should delete bimbingan without related data', async () => {
      mockPrismaService.users.findUnique
        .mockResolvedValueOnce({ user_id: dosenId })
        .mockResolvedValueOnce({ user_id: mahasiswaId });
      mockPrismaService.bimbingan.findFirst.mockResolvedValue({
        bimbingan_id: bimbinganId,
        status_bimbingan: status_bimbingan_enum.ongoing,
      });
      mockPrismaService.progress.count.mockResolvedValue(0);
      mockPrismaService.jadwal.count.mockResolvedValue(0);
      mockPrismaService.bimbingan.delete.mockResolvedValue({});

      const result = await service.hapusMahasiswaBimbingan(dosenId, mahasiswaId);

      expect(result).toEqual({ success: true });
      expect(prisma.bimbingan.delete).toHaveBeenCalledWith({
        where: { bimbingan_id: bimbinganId },
      });
    });

    // LINE 262: Test transaction when progress/jadwal exists
    it('should delete bimbingan with related progress and jadwal using transaction', async () => {
      mockPrismaService.users.findUnique
        .mockResolvedValueOnce({ user_id: dosenId })
        .mockResolvedValueOnce({ user_id: mahasiswaId });
      mockPrismaService.bimbingan.findFirst.mockResolvedValue({
        bimbingan_id: bimbinganId,
        status_bimbingan: status_bimbingan_enum.ongoing,
      });
      mockPrismaService.progress.count.mockResolvedValue(3);
      mockPrismaService.jadwal.count.mockResolvedValue(2);
      mockPrismaService.$transaction.mockResolvedValue([{}, {}, {}]);

      const result = await service.hapusMahasiswaBimbingan(dosenId, mahasiswaId);

      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should delete when only progress exists', async () => {
      mockPrismaService.users.findUnique
        .mockResolvedValueOnce({ user_id: dosenId })
        .mockResolvedValueOnce({ user_id: mahasiswaId });
      mockPrismaService.bimbingan.findFirst.mockResolvedValue({
        bimbingan_id: bimbinganId,
        status_bimbingan: status_bimbingan_enum.ongoing,
      });
      mockPrismaService.progress.count.mockResolvedValue(5);
      mockPrismaService.jadwal.count.mockResolvedValue(0);
      mockPrismaService.$transaction.mockResolvedValue([{}, {}, {}]);

      const result = await service.hapusMahasiswaBimbingan(dosenId, mahasiswaId);

      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should delete when only jadwal exists', async () => {
      mockPrismaService.users.findUnique
        .mockResolvedValueOnce({ user_id: dosenId })
        .mockResolvedValueOnce({ user_id: mahasiswaId });
      mockPrismaService.bimbingan.findFirst.mockResolvedValue({
        bimbingan_id: bimbinganId,
        status_bimbingan: status_bimbingan_enum.ongoing,
      });
      mockPrismaService.progress.count.mockResolvedValue(0);
      mockPrismaService.jadwal.count.mockResolvedValue(4);
      mockPrismaService.$transaction.mockResolvedValue([{}, {}, {}]);

      const result = await service.hapusMahasiswaBimbingan(dosenId, mahasiswaId);

      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty ids', async () => {
      await expect(service.hapusMahasiswaBimbingan('', mahasiswaId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.hapusMahasiswaBimbingan(dosenId, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when dosen not found', async () => {
      mockPrismaService.users.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ user_id: mahasiswaId });

      await expect(
        service.hapusMahasiswaBimbingan(dosenId, mahasiswaId),
      ).rejects.toThrow('Dosen tidak ditemukan');
    });

    it('should throw NotFoundException when mahasiswa not found', async () => {
      mockPrismaService.users.findUnique
        .mockResolvedValueOnce({ user_id: dosenId })
        .mockResolvedValueOnce(null);

      await expect(
        service.hapusMahasiswaBimbingan(dosenId, mahasiswaId),
      ).rejects.toThrow('Mahasiswa tidak ditemukan');
    });

    it('should throw NotFoundException when bimbingan not found', async () => {
      mockPrismaService.users.findUnique
        .mockResolvedValueOnce({ user_id: dosenId })
        .mockResolvedValueOnce({ user_id: mahasiswaId });
      mockPrismaService.bimbingan.findFirst.mockResolvedValue(null);

      await expect(
        service.hapusMahasiswaBimbingan(dosenId, mahasiswaId),
      ).rejects.toThrow('Data bimbingan tidak ditemukan');
    });

    it('should throw BadRequestException when bimbingan already done', async () => {
      mockPrismaService.users.findUnique
        .mockResolvedValueOnce({ user_id: dosenId })
        .mockResolvedValueOnce({ user_id: mahasiswaId });
      mockPrismaService.bimbingan.findFirst.mockResolvedValue({
        bimbingan_id: bimbinganId,
        status_bimbingan: status_bimbingan_enum.done,
      });

      await expect(
        service.hapusMahasiswaBimbingan(dosenId, mahasiswaId),
      ).rejects.toThrow('Tidak dapat menghapus bimbingan yang sudah selesai');
    });

    it('should throw InternalServerErrorException on database error', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.hapusMahasiswaBimbingan(dosenId, mahasiswaId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('selesaiBimbingan', () => {
    const mahasiswaId = 'mhs-1';

    it('should mark bimbingan as done', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: mahasiswaId,
        role: 'mahasiswa',
      });
      mockPrismaService.bimbingan.findMany.mockResolvedValue([
        {
          bimbingan_id: 'bimbingan-1',
          status_bimbingan: status_bimbingan_enum.ongoing,
        },
        {
          bimbingan_id: 'bimbingan-2',
          status_bimbingan: status_bimbingan_enum.ongoing,
        },
      ]);
      mockPrismaService.bimbingan.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.selesaiBimbingan(mahasiswaId);

      expect(result).toEqual({ success: true });
    });

    it('should throw BadRequestException for empty mahasiswa_id', async () => {
      await expect(service.selesaiBimbingan('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when mahasiswa not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.selesaiBimbingan(mahasiswaId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user is not mahasiswa', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: mahasiswaId,
        role: 'dosen',
      });

      await expect(service.selesaiBimbingan(mahasiswaId)).rejects.toThrow(
        'User bukan mahasiswa',
      );
    });

    it('should throw NotFoundException when no active bimbingan', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        user_id: mahasiswaId,
        role: 'mahasiswa',
      });
      mockPrismaService.bimbingan.findMany.mockResolvedValue([]);

      await expect(service.selesaiBimbingan(mahasiswaId)).rejects.toThrow(
        'Tidak ada bimbingan aktif untuk diselesaikan',
      );
    });

    // LINE 355 & 420: Test InternalServerErrorException
    it('should throw InternalServerErrorException on database error', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.selesaiBimbingan(mahasiswaId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});