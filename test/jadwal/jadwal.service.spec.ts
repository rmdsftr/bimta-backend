import { Test, TestingModule } from '@nestjs/testing';
import { JadwalService } from '../../src/jadwal/jadwal.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { AddJadwalDto } from '../../src/jadwal/dto/add-jadwal.dto';
import { ResponseJadwal } from '../../src/jadwal/dto/accepted-jadwal.dto';
import { status_jadwal_enum } from '@prisma/client';

describe('JadwalService', () => {
  let service: JadwalService;
  let prisma: any;

  const prismaMock = {
    bimbingan: {
      findMany: jest.fn(),
    },
    jadwal: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JadwalService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<JadwalService>(JadwalService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  // ===============================================================
  // TEST: addJadwal() - Lines 45
  // ===============================================================
  describe('addJadwal', () => {
    it('should create jadwal for all bimbingan', async () => {
      const dto: AddJadwalDto = {
        judul: 'Bimbingan BAB 1',
        tanggal: '2024-12-25',
        waktu: '10:00',
        lokasi: 'Ruang Dosen',
        pesan: 'Review BAB 1',
      };

      prismaMock.bimbingan.findMany.mockResolvedValue([
        { bimbingan_id: 'B1' },
        { bimbingan_id: 'B2' },
      ]);

      prismaMock.jadwal.createMany.mockResolvedValue({ count: 2 });

      const result = await service.addJadwal(dto, 'MHS123');

      expect(result).toEqual({ count: 2 });
      expect(prismaMock.jadwal.createMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when bimbingan not found', async () => {
      const dto: AddJadwalDto = {
        judul: 'Test',
        tanggal: '2024-12-25',
        waktu: '10:00',
        lokasi: 'Test',
        pesan: 'Test',
      };

      prismaMock.bimbingan.findMany.mockResolvedValue([]);

      await expect(service.addJadwal(dto, 'MHS-INVALID')).rejects.toThrow(
        NotFoundException
      );

      await expect(service.addJadwal(dto, 'MHS-INVALID')).rejects.toThrow(
        'Bimbingan tidak ditemukan untuk mahasiswa ini'
      );
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      const dto: AddJadwalDto = {
        judul: 'Test',
        tanggal: '2024-12-25',
        waktu: '10:00',
        lokasi: 'Test',
        pesan: 'Test',
      };

      prismaMock.bimbingan.findMany.mockRejectedValue('String error');

      await expect(service.addJadwal(dto, 'MHS123')).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('should rethrow Error instances', async () => {
      const dto: AddJadwalDto = {
        judul: 'Test',
        tanggal: '2024-12-25',
        waktu: '10:00',
        lokasi: 'Test',
        pesan: 'Test',
      };

      const error = new Error('Database error');
      prismaMock.bimbingan.findMany.mockRejectedValue(error);

      await expect(service.addJadwal(dto, 'MHS123')).rejects.toThrow(
        'Database error'
      );
    });
  });

  // ===============================================================
  // TEST: viewJadwal() - Lines 106, 113-178
  // ===============================================================
  describe('viewJadwal', () => {
    it('should return formatted jadwal list', async () => {
      prismaMock.bimbingan.findMany
        .mockResolvedValueOnce([
          { bimbingan_id: 'B1' },
          { bimbingan_id: 'B2' },
        ])
        .mockResolvedValueOnce([
          { bimbingan_id: 'B1' },
          { bimbingan_id: 'B2' },
        ]);

      prismaMock.jadwal.findMany.mockResolvedValue([
        {
          bimbingan_id: 'B1',
          judul_pertemuan: 'Bimbingan BAB 1',
          datetime: new Date('2024-12-25T10:00:00'),
          lokasi: 'Ruang Dosen',
          note_mahasiswa: 'Review BAB 1',
          status_jadwal: 'waiting',
          note_dosen: null,
        },
      ]);

      const result = await service.viewJadwal('MHS123');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        subjek: 'Bimbingan BAB 1',
        tanggal: '2024-12-25',
        lokasi: 'Ruang Dosen',
        pesan: 'Review BAB 1',
        status: 'waiting',
        pesanDosen: null,
      });
      expect(result[0].waktu).toBeDefined();
    });

    it('should throw NotFoundException when bimbingan not found', async () => {
      prismaMock.bimbingan.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await expect(service.viewJadwal('MHS-INVALID')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      prismaMock.bimbingan.findMany.mockRejectedValue('String error');

      await expect(service.viewJadwal('MHS123')).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('should rethrow Error instances', async () => {
      const error = new Error('Database error');
      prismaMock.bimbingan.findMany.mockRejectedValue(error);

      await expect(service.viewJadwal('MHS123')).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle datetime formatting correctly', async () => {
      prismaMock.bimbingan.findMany
        .mockResolvedValueOnce([{ bimbingan_id: 'B1' }])
        .mockResolvedValueOnce([{ bimbingan_id: 'B1' }]);

      prismaMock.jadwal.findMany.mockResolvedValue([
        {
          bimbingan_id: 'B1',
          judul_pertemuan: 'Test',
          datetime: new Date('2024-12-25T15:30:45'),
          lokasi: 'Test',
          note_mahasiswa: 'Test',
          status_jadwal: 'waiting',
          note_dosen: 'Test note',
        },
      ]);

      const result = await service.viewJadwal('MHS123');

      expect(result[0].tanggal).toBe('2024-12-25');
      expect(result[0].waktu).toMatch(/^\d{2}:\d{2}:\d{2}$/); // Format HH:MM:SS
      expect(result[0].pesanDosen).toBe('Test note');
    });
  });

  // ===============================================================
  // TEST: getJadwalDosen() - Lines 198-202
  // ===============================================================
  describe('getJadwalDosen', () => {
    it('should return formatted jadwal for dosen', async () => {
      prismaMock.bimbingan.findMany.mockResolvedValue([
        { bimbingan_id: 'B1' },
      ]);

      prismaMock.jadwal.findMany.mockResolvedValue([
        {
          bimbingan_id: 'B1',
          bimbingan: {
            mahasiswa_id: 'MHS123',
            users_bimbingan_mahasiswa_idTousers: {
              nama: 'John Doe',
              photo_url: 'http://photo.url',
            },
          },
          judul_pertemuan: 'BAB 1',
          datetime: new Date('2024-12-25T10:30:00'),
          lokasi: 'Ruang Dosen',
          note_mahasiswa: 'Review',
          status_jadwal: 'waiting',
          note_dosen: null,
        },
      ]);

      const result = await service.getJadwalDosen('DOSEN1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        bimbingan_id: 'B1',
        nama: 'John Doe',
        nim: 'MHS123',
        photo_url: 'http://photo.url',
        tanggal: '2024-12-25',
        waktu: '10:30',
        lokasi: 'Ruang Dosen',
        topik: 'BAB 1',
        pesan: 'Review',
        status: 'waiting',
        pesanDosen: null,
      });
      expect(result[0].datetime).toBeInstanceOf(Date);
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      prismaMock.bimbingan.findMany.mockRejectedValue('String error');

      await expect(service.getJadwalDosen('DOSEN1')).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('should rethrow Error instances', async () => {
      const error = new Error('Database error');
      prismaMock.bimbingan.findMany.mockRejectedValue(error);

      await expect(service.getJadwalDosen('DOSEN1')).rejects.toThrow(
        'Database error'
      );
    });

    it('should format waktu to HH:MM correctly', async () => {
      prismaMock.bimbingan.findMany.mockResolvedValue([
        { bimbingan_id: 'B1' },
      ]);

      prismaMock.jadwal.findMany.mockResolvedValue([
        {
          bimbingan_id: 'B1',
          bimbingan: {
            mahasiswa_id: 'MHS123',
            users_bimbingan_mahasiswa_idTousers: {
              nama: 'Test',
              photo_url: null,
            },
          },
          judul_pertemuan: 'Test',
          datetime: new Date('2024-12-25T09:05:30'),
          lokasi: 'Test',
          note_mahasiswa: 'Test',
          status_jadwal: 'accepted',
          note_dosen: 'Oke',
        },
      ]);

      const result = await service.getJadwalDosen('DOSEN1');

      expect(result[0].waktu).toBe('09:05');
      expect(result[0].pesanDosen).toBe('Oke');
    });
  });

  // ===============================================================
  // TEST: acceptedJadwal() - Lines 222-226
  // ===============================================================
  describe('acceptedJadwal', () => {
    it('should accept jadwal successfully', async () => {
      const dto: ResponseJadwal = {
        note_dosen: 'Oke, saya setuju',
      };

      prismaMock.jadwal.update.mockResolvedValue({});

      const result = await service.acceptedJadwal(
        'B1',
        '2024-12-25T10:00:00',
        dto
      );

      expect(result).toEqual({ message: 'Bimbingan offline disetujui' });
      expect(prismaMock.jadwal.update).toHaveBeenCalledWith({
        where: {
          bimbingan_id_datetime: {
            bimbingan_id: 'B1',
            datetime: new Date('2024-12-25T10:00:00'),
          },
        },
        data: {
          note_dosen: 'Oke, saya setuju',
          status_jadwal: status_jadwal_enum.accepted,
        },
      });
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      const dto: ResponseJadwal = { note_dosen: 'OK' };

      prismaMock.jadwal.update.mockRejectedValue('String error');

      await expect(
        service.acceptedJadwal('B1', '2024-12-25T10:00:00', dto)
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should rethrow Error instances', async () => {
      const dto: ResponseJadwal = { note_dosen: 'OK' };
      const error = new Error('Database error');

      prismaMock.jadwal.update.mockRejectedValue(error);

      await expect(
        service.acceptedJadwal('B1', '2024-12-25T10:00:00', dto)
      ).rejects.toThrow('Database error');
    });
  });

  // ===============================================================
  // TEST: declinedJadwal() - Lines 246-250
  // ===============================================================
  describe('declinedJadwal', () => {
    it('should decline jadwal successfully', async () => {
      const dto: ResponseJadwal = {
        note_dosen: 'Maaf, saya tidak bisa',
      };

      prismaMock.jadwal.update.mockResolvedValue({});

      const result = await service.declinedJadwal(
        'B1',
        '2024-12-25T10:00:00',
        dto
      );

      expect(result).toEqual({ message: 'Bimbingan offline ditolak' });
      expect(prismaMock.jadwal.update).toHaveBeenCalledWith({
        where: {
          bimbingan_id_datetime: {
            bimbingan_id: 'B1',
            datetime: new Date('2024-12-25T10:00:00'),
          },
        },
        data: {
          note_dosen: 'Maaf, saya tidak bisa',
          status_jadwal: status_jadwal_enum.declined,
        },
      });
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      const dto: ResponseJadwal = { note_dosen: 'No' };

      prismaMock.jadwal.update.mockRejectedValue('String error');

      await expect(
        service.declinedJadwal('B1', '2024-12-25T10:00:00', dto)
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should rethrow Error instances', async () => {
      const dto: ResponseJadwal = { note_dosen: 'No' };
      const error = new Error('Database error');

      prismaMock.jadwal.update.mockRejectedValue(error);

      await expect(
        service.declinedJadwal('B1', '2024-12-25T10:00:00', dto)
      ).rejects.toThrow('Database error');
    });
  });

  // ===============================================================
  // TEST: cancelJadwal() - Lines 270-274
  // ===============================================================
  describe('cancelJadwal', () => {
    it('should cancel jadwal successfully', async () => {
      const dto: ResponseJadwal = {
        note_dosen: 'Dibatalkan',
      };

      prismaMock.jadwal.update.mockResolvedValue({});

      const result = await service.cancelJadwal(
        'B1',
        '2024-12-25T10:00:00',
        dto
      );

      expect(result).toEqual({ message: 'Bimbingan offline dibatalkan' });
      expect(prismaMock.jadwal.update).toHaveBeenCalledWith({
        where: {
          bimbingan_id_datetime: {
            bimbingan_id: 'B1',
            datetime: new Date('2024-12-25T10:00:00'),
          },
        },
        data: {
          note_dosen: 'Dibatalkan',
          status_jadwal: status_jadwal_enum.declined,
        },
      });
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      const dto: ResponseJadwal = { note_dosen: 'Cancel' };

      prismaMock.jadwal.update.mockRejectedValue('String error');

      await expect(
        service.cancelJadwal('B1', '2024-12-25T10:00:00', dto)
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should rethrow Error instances', async () => {
      const dto: ResponseJadwal = { note_dosen: 'Cancel' };
      const error = new Error('Database error');

      prismaMock.jadwal.update.mockRejectedValue(error);

      await expect(
        service.cancelJadwal('B1', '2024-12-25T10:00:00', dto)
      ).rejects.toThrow('Database error');
    });
  });

  // ===============================================================
  // TEST: doneJadwal()
  // ===============================================================
  describe('doneJadwal', () => {
    it('should mark jadwal as done successfully', async () => {
      const dto: ResponseJadwal = {
        note_dosen: 'Bimbingan selesai',
      };

      prismaMock.jadwal.update.mockResolvedValue({});

      const result = await service.doneJadwal('B1', '2024-12-25T10:00:00', dto);

      expect(result).toEqual({ message: 'Bimbingan offline selesai' });
      expect(prismaMock.jadwal.update).toHaveBeenCalledWith({
        where: {
          bimbingan_id_datetime: {
            bimbingan_id: 'B1',
            datetime: new Date('2024-12-25T10:00:00'),
          },
        },
        data: {
          note_dosen: 'Bimbingan selesai',
          status_jadwal: status_jadwal_enum.done,
        },
      });
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      const dto: ResponseJadwal = { note_dosen: 'Done' };

      prismaMock.jadwal.update.mockRejectedValue('String error');

      await expect(
        service.doneJadwal('B1', '2024-12-25T10:00:00', dto)
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should rethrow Error instances', async () => {
      const dto: ResponseJadwal = { note_dosen: 'Done' };
      const error = new Error('Database error');

      prismaMock.jadwal.update.mockRejectedValue(error);

      await expect(
        service.doneJadwal('B1', '2024-12-25T10:00:00', dto)
      ).rejects.toThrow('Database error');
    });
  });
});