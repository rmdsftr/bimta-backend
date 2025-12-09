import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BimbinganService } from '../../src/bimbingan/bimbingan.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { status_bimbingan_enum } from '@prisma/client';

describe('BimbinganService', () => {
  let service: BimbinganService;
  let prisma: PrismaService;

  const mockPrisma = {
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
    jadwal: {
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    progress: {
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
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<BimbinganService>(BimbinganService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('mahasiswaDibimbing', () => {
    it('should return list mahasiswa dibimbing', async () => {
      const mockDosen = { user_id: '123' };
      const mockMahasiswa = [
        {
          status_bimbingan: 'ongoing',
          users_bimbingan_mahasiswa_idTousers: {
            user_id: 'mhs1',
            nama: 'Mahasiswa 1',
            judul: 'Judul Test',
            photo_url: 'photo.jpg',
          },
        },
      ];

      mockPrisma.users.findUnique.mockResolvedValue(mockDosen);
      mockPrisma.bimbingan.findMany.mockResolvedValue(mockMahasiswa);

      const result = await service.mahasiswaDibimbing('123');

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { user_id: '123' },
        select: { user_id: true },
      });
      expect(prisma.bimbingan.findMany).toHaveBeenCalledWith({
        where: { dosen_id: '123' },
        select: {
          status_bimbingan: true,
          users_bimbingan_mahasiswa_idTousers: {
            select: {
              user_id: true,
              nama: true,
              judul: true,
              photo_url: true,
            },
          },
        },
      });
      expect(result).toEqual(mockMahasiswa);
    });

    it('should throw NotFoundException if dosen not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(service.mahasiswaDibimbing('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addMahasiswa', () => {
    const validDto = {
      dosen_id: 'dosen1',
      mahasiswa_id: ['mhs1', 'mhs2'],
    };

    it('should successfully add mahasiswa to bimbingan', async () => {
      const mockDosen = {
        user_id: 'dosen1',
        role: 'dosen',
        status_user: 'active',
      };
      const mockMahasiswa = [
        { user_id: 'mhs1', role: 'mahasiswa', status_user: 'active' },
        { user_id: 'mhs2', role: 'mahasiswa', status_user: 'active' },
      ];

      mockPrisma.users.findUnique.mockResolvedValue(mockDosen);
      mockPrisma.users.findMany.mockResolvedValue(mockMahasiswa);
      mockPrisma.bimbingan.findMany.mockResolvedValue([]);
      mockPrisma.bimbingan.createMany.mockResolvedValue({ count: 2 });

      const result = await service.addMahasiswa(validDto);

      expect(result).toEqual({ success: true });
      expect(prisma.bimbingan.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            bimbingan_id: 'dosen1-mhs1',
            dosen_id: 'dosen1',
            mahasiswa_id: 'mhs1',
            status_bimbingan: status_bimbingan_enum.ongoing,
            total_bimbingan: 0,
          }),
        ]),
        skipDuplicates: true,
      });
    });

    it('should throw BadRequestException for empty dosen_id', async () => {
      await expect(
        service.addMahasiswa({ dosen_id: '', mahasiswa_id: ['mhs1'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty mahasiswa_id array', async () => {
      await expect(
        service.addMahasiswa({ dosen_id: 'dosen1', mahasiswa_id: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if dosen not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(service.addMahasiswa(validDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user is not dosen', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        user_id: 'dosen1',
        role: 'mahasiswa',
        status_user: 'active',
      });

      await expect(service.addMahasiswa(validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if dosen is not active', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        user_id: 'dosen1',
        role: 'dosen',
        status_user: 'inactive',
      });

      await expect(service.addMahasiswa(validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if some mahasiswa not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        user_id: 'dosen1',
        role: 'dosen',
        status_user: 'active',
      });
      mockPrisma.users.findMany.mockResolvedValue([
        { user_id: 'mhs1', role: 'mahasiswa', status_user: 'active' },
      ]);

      await expect(service.addMahasiswa(validDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if mahasiswa already registered', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        user_id: 'dosen1',
        role: 'dosen',
        status_user: 'active',
      });
      mockPrisma.users.findMany.mockResolvedValue([
        { user_id: 'mhs1', role: 'mahasiswa', status_user: 'active' },
        { user_id: 'mhs2', role: 'mahasiswa', status_user: 'active' },
      ]);
      mockPrisma.bimbingan.findMany.mockResolvedValue([
        { mahasiswa_id: 'mhs1', status_bimbingan: 'ongoing' },
      ]);

      await expect(service.addMahasiswa(validDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should filter out duplicate and invalid mahasiswa_id', async () => {
      const dtoWithDuplicates = {
        dosen_id: 'dosen1',
        mahasiswa_id: ['mhs1', 'mhs1', '', 'mhs2', '  '],
      };

      mockPrisma.users.findUnique.mockResolvedValue({
        user_id: 'dosen1',
        role: 'dosen',
        status_user: 'active',
      });
      mockPrisma.users.findMany.mockResolvedValue([
        { user_id: 'mhs1', role: 'mahasiswa', status_user: 'active' },
        { user_id: 'mhs2', role: 'mahasiswa', status_user: 'active' },
      ]);
      mockPrisma.bimbingan.findMany.mockResolvedValue([]);
      mockPrisma.bimbingan.createMany.mockResolvedValue({ count: 2 });

      await service.addMahasiswa(dtoWithDuplicates);

      expect(prisma.bimbingan.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ mahasiswa_id: 'mhs1' }),
          expect.objectContaining({ mahasiswa_id: 'mhs2' }),
        ]),
        skipDuplicates: true,
      });
      expect(
        (prisma.bimbingan.createMany as jest.Mock).mock.calls[0][0].data,
      ).toHaveLength(2);
    });
  });

  describe('dosenPembimbing', () => {
    it('should return dosen pembimbing list', async () => {
      const mockMahasiswa = {
        user_id: 'mhs1',
        role: 'mahasiswa',
      };
      const mockDosen = [
        {
          users_bimbingan_dosen_idTousers: {
            nama: 'Dosen Test',
          },
        },
      ];

      mockPrisma.users.findUnique.mockResolvedValue(mockMahasiswa);
      mockPrisma.bimbingan.findMany.mockResolvedValue(mockDosen);

      const result = await service.dosenPembimbing('mhs1');

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { user_id: 'mhs1' },
        select: { user_id: true, role: true },
      });
      expect(result).toEqual(mockDosen);
    });

    it('should throw BadRequestException for empty mahasiswa_id', async () => {
      await expect(service.dosenPembimbing('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if mahasiswa not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(service.dosenPembimbing('mhs999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user is not mahasiswa', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        user_id: 'mhs1',
        role: 'dosen',
      });

      await expect(service.dosenPembimbing('mhs1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('jumlahMahasiswaBimbingan', () => {
    it('should return count of active bimbingan', async () => {
      const mockDosen = {
        user_id: 'dosen1',
        role: 'dosen',
      };
      mockPrisma.users.findUnique.mockResolvedValue(mockDosen);
      mockPrisma.bimbingan.count.mockResolvedValue(7);

      const result = await service.jumlahMahasiswaBimbingan('dosen1');

      expect(result).toBe(7);
      expect(prisma.bimbingan.count).toHaveBeenCalledWith({
        where: {
          dosen_id: 'dosen1',
          NOT: {
            status_bimbingan: status_bimbingan_enum.done,
          },
        },
      });
    });

    it('should throw BadRequestException for empty dosen_id', async () => {
      await expect(service.jumlahMahasiswaBimbingan('  ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if dosen not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(service.jumlahMahasiswaBimbingan('dosen999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user is not dosen', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        user_id: 'dosen1',
        role: 'mahasiswa',
      });

      await expect(service.jumlahMahasiswaBimbingan('dosen1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('hapusMahasiswaBimbingan', () => {
    it('should delete bimbingan with related data using transaction', async () => {
      const mockDosen = { user_id: 'dosen1' };
      const mockMahasiswa = { user_id: 'mhs1' };
      const mockBimbingan = {
        bimbingan_id: 'dosen1-mhs1',
        status_bimbingan: status_bimbingan_enum.ongoing,
      };

      mockPrisma.users.findUnique
        .mockResolvedValueOnce(mockDosen)
        .mockResolvedValueOnce(mockMahasiswa);
      mockPrisma.bimbingan.findFirst.mockResolvedValue(mockBimbingan);
      mockPrisma.progress.count.mockResolvedValue(2);
      mockPrisma.jadwal.count.mockResolvedValue(1);
      mockPrisma.$transaction.mockResolvedValue([{}, {}, {}]);

      const result = await service.hapusMahasiswaBimbingan('dosen1', 'mhs1');

      expect(result).toEqual({ success: true });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should delete bimbingan without transaction if no related data', async () => {
      const mockDosen = { user_id: 'dosen1' };
      const mockMahasiswa = { user_id: 'mhs1' };
      const mockBimbingan = {
        bimbingan_id: 'dosen1-mhs1',
        status_bimbingan: status_bimbingan_enum.ongoing,
      };

      mockPrisma.users.findUnique
        .mockResolvedValueOnce(mockDosen)
        .mockResolvedValueOnce(mockMahasiswa);
      mockPrisma.bimbingan.findFirst.mockResolvedValue(mockBimbingan);
      mockPrisma.progress.count.mockResolvedValue(0);
      mockPrisma.jadwal.count.mockResolvedValue(0);
      mockPrisma.bimbingan.delete.mockResolvedValue(mockBimbingan);

      const result = await service.hapusMahasiswaBimbingan('dosen1', 'mhs1');

      expect(result).toEqual({ success: true });
      expect(prisma.bimbingan.delete).toHaveBeenCalledWith({
        where: { bimbingan_id: 'dosen1-mhs1' },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty parameters', async () => {
      await expect(service.hapusMahasiswaBimbingan('', 'mhs1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        service.hapusMahasiswaBimbingan('dosen1', ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if dosen not found', async () => {
      mockPrisma.users.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ user_id: 'mhs1' });

      await expect(
        service.hapusMahasiswaBimbingan('dosen999', 'mhs1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if mahasiswa not found', async () => {
      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ user_id: 'dosen1' })
        .mockResolvedValueOnce(null);

      await expect(
        service.hapusMahasiswaBimbingan('dosen1', 'mhs999'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if bimbingan not found', async () => {
      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ user_id: 'dosen1' })
        .mockResolvedValueOnce({ user_id: 'mhs1' });
      mockPrisma.bimbingan.findFirst.mockResolvedValue(null);

      await expect(
        service.hapusMahasiswaBimbingan('dosen1', 'mhs1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if bimbingan is already done', async () => {
      mockPrisma.users.findUnique
        .mockResolvedValueOnce({ user_id: 'dosen1' })
        .mockResolvedValueOnce({ user_id: 'mhs1' });
      mockPrisma.bimbingan.findFirst.mockResolvedValue({
        bimbingan_id: 'dosen1-mhs1',
        status_bimbingan: status_bimbingan_enum.done,
      });

      await expect(
        service.hapusMahasiswaBimbingan('dosen1', 'mhs1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('selesaiBimbingan', () => {
    it('should update bimbingan status to done', async () => {
      const mockMahasiswa = {
        user_id: 'mhs1',
        role: 'mahasiswa',
      };
      const mockBimbingan = [
        { bimbingan_id: 'dosen1-mhs1', status_bimbingan: 'ongoing' },
        { bimbingan_id: 'dosen2-mhs1', status_bimbingan: 'ongoing' },
      ];

      mockPrisma.users.findUnique.mockResolvedValue(mockMahasiswa);
      mockPrisma.bimbingan.findMany.mockResolvedValue(mockBimbingan);
      mockPrisma.bimbingan.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.selesaiBimbingan('mhs1');

      expect(result).toEqual({ success: true });
      expect(prisma.bimbingan.updateMany).toHaveBeenCalledWith({
        where: {
          bimbingan_id: {
            in: ['dosen1-mhs1', 'dosen2-mhs1'],
          },
        },
        data: {
          status_bimbingan: status_bimbingan_enum.done,
        },
      });
    });

    it('should throw BadRequestException for empty mahasiswa_id', async () => {
      await expect(service.selesaiBimbingan('   ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if mahasiswa not found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);

      await expect(service.selesaiBimbingan('mhs999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user is not mahasiswa', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        user_id: 'mhs1',
        role: 'dosen',
      });

      await expect(service.selesaiBimbingan('mhs1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if no active bimbingan found', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({
        user_id: 'mhs1',
        role: 'mahasiswa',
      });
      mockPrisma.bimbingan.findMany.mockResolvedValue([]);

      await expect(service.selesaiBimbingan('mhs1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});