import { Test, TestingModule } from '@nestjs/testing';
import { JadwalService } from '../../src/jadwal/jadwal.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { status_jadwal_enum } from '@prisma/client';

describe('JadwalService', () => {
  let service: JadwalService;
  let prisma: PrismaService;

  const mockPrisma = {
    bimbingan: {
      findMany: jest.fn(),
    },
    jadwal: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JadwalService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<JadwalService>(JadwalService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  // =======================
  // ADD JADWAL
  // =======================
  it('should add jadwal successfully', async () => {
    mockPrisma.bimbingan.findMany.mockResolvedValue([{ bimbingan_id: 'B1' }]);
    mockPrisma.jadwal.createMany.mockResolvedValue({ count: 1 });

    const dto = {
      judul: 'Bimbingan 1',
      tanggal: '2025-01-01',
      waktu: '10:00',
      lokasi: 'Ruang A',
      pesan: 'Siap hadir',
    };

    const result = await service.addJadwal(dto, 'M1');

    expect(result).toEqual({ count: 1 });
    expect(prisma.jadwal.createMany).toHaveBeenCalled();
  });

  it('should throw NotFoundException when student has no bimbingan', async () => {
    mockPrisma.bimbingan.findMany.mockResolvedValue([]);

    const dto = {
      judul: 'Bimbingan',
      tanggal: '2025-01-01',
      waktu: '10:00',
      lokasi: 'Ruang A',
      pesan: 'Halo',
    };

    await expect(service.addJadwal(dto, 'M1')).rejects.toThrow(
      NotFoundException,
    );
  });

  // =======================
  // VIEW JADWAL
  // =======================
  it('should return student jadwal list', async () => {
    mockPrisma.bimbingan.findMany
      .mockResolvedValueOnce([{ bimbingan_id: 'B1' }])
      .mockResolvedValueOnce([{ bimbingan_id: 'B1' }]);

    mockPrisma.jadwal.findMany.mockResolvedValue([
      {
        bimbingan_id: 'B1',
        judul_pertemuan: 'Topik A',
        datetime: new Date('2025-01-01T10:00'),
        lokasi: 'Ruang B',
        note_mahasiswa: 'Pesan test',
        status_jadwal: status_jadwal_enum.waiting,
        note_dosen: null,
      },
    ]);

    const result = await service.viewJadwal('M1');

    expect(result.length).toBe(1);
    expect(result[0].subjek).toBe('Topik A');
  });

  it('should throw NotFoundException when no bimbingan found (view)', async () => {
    mockPrisma.bimbingan.findMany.mockResolvedValue([]);

    await expect(service.viewJadwal('M1')).rejects.toThrow(NotFoundException);
  });

  // =======================
  // ACCEPT / DECLINE / CANCEL / DONE
  // =======================
  const statusTests = [
    { fn: 'acceptedJadwal', expected: status_jadwal_enum.accepted },
    { fn: 'declinedJadwal', expected: status_jadwal_enum.declined },
    { fn: 'cancelJadwal', expected: status_jadwal_enum.declined },
    { fn: 'doneJadwal', expected: status_jadwal_enum.done },
  ];

  statusTests.forEach((testCase) => {
    it(`should update jadwal status to ${testCase.expected}`, async () => {
      mockPrisma.jadwal.update.mockResolvedValue(true);

      const result = await service[testCase.fn]('B1', '2025-01-01T10:00', {
        note_dosen: 'OK',
      });

      expect(prisma.jadwal.update).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });
  });
});
