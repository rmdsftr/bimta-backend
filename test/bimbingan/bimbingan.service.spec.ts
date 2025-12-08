import { Test, TestingModule } from '@nestjs/testing';
import { BimbinganService } from '../../src/bimbingan/bimbingan.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { status_bimbingan_enum } from '@prisma/client';

describe('BimbinganService', () => {
  let service: BimbinganService;
  let prisma: PrismaService;

  const mockPrisma = {
    bimbingan: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    jadwal: {
      deleteMany: jest.fn(),
    },
    progress: {
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
    it('should return list mahasiswa', async () => {
      mockPrisma.bimbingan.findMany.mockResolvedValue([{ nama: 'Tes' }]);

      const result = await service.mahasiswaDibimbing('123');

      expect(result.length).toBeGreaterThan(0);
      expect(prisma.bimbingan.findMany).toHaveBeenCalled();
    });
  });

  describe('addMahasiswa', () => {
    it('should insert mahasiswa list', async () => {
      mockPrisma.bimbingan.createMany.mockResolvedValue(true);

      const dto = { dosen_id: '1', mahasiswa_id: ['100', '101'] };

      const result = await service.addMahasiswa(dto);

      expect(prisma.bimbingan.createMany).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('dosenPembimbing', () => {
    it('should return dosen pembimbing', async () => {
      mockPrisma.bimbingan.findMany.mockResolvedValue([{ nama: 'Dosen Tes' }]);

      const result = await service.dosenPembimbing('2211');

      expect(prisma.bimbingan.findMany).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('jumlahMahasiswaBimbingan', () => {
    it('should return count', async () => {
      mockPrisma.bimbingan.count.mockResolvedValue(7);

      const result = await service.jumlahMahasiswaBimbingan('123');

      expect(result).toBe(7);
      expect(prisma.bimbingan.count).toHaveBeenCalled();
    });
  });

  describe('hapusMahasiswaBimbingan', () => {
    it('should delete data bimbingan + related', async () => {
      mockPrisma.bimbingan.findFirst.mockResolvedValue({
        bimbingan_id: 'BIM-100',
      });

      mockPrisma.$transaction.mockResolvedValue(true);

      const result = await service.hapusMahasiswaBimbingan('1', '100');

      expect(prisma.bimbingan.findFirst).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('selesaiBimbingan', () => {
    it('should update bimbingan status to done', async () => {
      mockPrisma.bimbingan.findMany.mockResolvedValue([
        { bimbingan_id: 'BIM-100' },
      ]);

      mockPrisma.bimbingan.updateMany.mockResolvedValue(true);

      await service.selesaiBimbingan('100');

      expect(prisma.bimbingan.updateMany).toHaveBeenCalledWith({
        where: { bimbingan_id: { in: ['BIM-100'] } },
        data: { status_bimbingan: status_bimbingan_enum.done },
      });
    });
  });
});
