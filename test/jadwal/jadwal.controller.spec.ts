import { Test, TestingModule } from '@nestjs/testing';
import { JadwalController } from '../../src/jadwal/jadwal.controller';
import { JadwalService } from '../../src/jadwal/jadwal.service';
import { AddJadwalDto } from '../../src/jadwal/dto/add-jadwal.dto';
import { ResponseJadwal } from '../../src/jadwal/dto/accepted-jadwal.dto';

describe('JadwalController - Complete Coverage', () => {
  let controller: JadwalController;
  let service: JadwalService;

  const mockJadwalService = {
    addJadwal: jest.fn(),
    viewJadwal: jest.fn(),
    getJadwalDosen: jest.fn(),
    acceptedJadwal: jest.fn(),
    declinedJadwal: jest.fn(),
    cancelJadwal: jest.fn(),
    doneJadwal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JadwalController],
      providers: [
        {
          provide: JadwalService,
          useValue: mockJadwalService,
        },
      ],
    }).compile();

    controller = module.get<JadwalController>(JadwalController);
    service = module.get<JadwalService>(JadwalService);
    jest.clearAllMocks();
  });

  describe('addJadwal', () => {
    it('should add jadwal successfully', async () => {
      const dto: AddJadwalDto = {
        judul: 'Bimbingan 1',
      tanggal: '2024-01-01',
      waktu: '10:00',
      lokasi: 'Ruang Dosen',
      pesan: 'Mohon bimbingan proposal',
      };
      const mahasiswa_id = '123';
      const mockResult = { success: true };

      mockJadwalService.addJadwal.mockResolvedValue(mockResult);
      const result = await controller.addJadwal(dto, mahasiswa_id);

      expect(service.addJadwal).toHaveBeenCalledWith(dto, mahasiswa_id);
      expect(result).toEqual(mockResult);
    });
  });

  describe('viewJadwal', () => {
    it('should view jadwal mahasiswa', async () => {
      const mahasiswa_id = '123';
      const mockResult = [{ datetime: new Date(), judul_pertemuan: 'Test' }];

      mockJadwalService.viewJadwal.mockResolvedValue(mockResult);
      const result = await controller.viewJadwal(mahasiswa_id);

      expect(service.viewJadwal).toHaveBeenCalledWith(mahasiswa_id);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getJadwalDosen', () => {
    it('should get jadwal dosen', async () => {
      const dosen_id = '456';
      const mockResult = [{ datetime: new Date(), mahasiswa: 'Test' }];

      mockJadwalService.getJadwalDosen.mockResolvedValue(mockResult);
      const result = await controller.getJadwalDosen(dosen_id);

      expect(service.getJadwalDosen).toHaveBeenCalledWith(dosen_id);
      expect(result).toEqual(mockResult);
    });
  });

  describe('acceptedJadwal', () => {
    it('should accept jadwal', async () => {
      const bimbingan_id = '1';
      const datetime = '2024-01-01T10:00:00';
      const dto: ResponseJadwal = { note_dosen: 'Approved' };
      const mockResult = { success: true };

      mockJadwalService.acceptedJadwal.mockResolvedValue(mockResult);
      const result = await controller.acceptedJadwal(bimbingan_id, datetime, dto);

      expect(service.acceptedJadwal).toHaveBeenCalledWith(bimbingan_id, datetime, dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('declinedJadwal', () => {
    it('should decline jadwal', async () => {
      const bimbingan_id = '1';
      const datetime = '2024-01-01T10:00:00';
      const dto: ResponseJadwal = { note_dosen: 'Declined' };
      const mockResult = { success: true };

      mockJadwalService.declinedJadwal.mockResolvedValue(mockResult);
      const result = await controller.declinedJadwal(bimbingan_id, datetime, dto);

      expect(service.declinedJadwal).toHaveBeenCalledWith(bimbingan_id, datetime, dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('cancelJadwal', () => {
    it('should cancel jadwal', async () => {
      const bimbingan_id = '1';
      const datetime = '2024-01-01T10:00:00';
      const dto: ResponseJadwal = { note_dosen: 'Cancelled' };
      const mockResult = { success: true };

      mockJadwalService.cancelJadwal.mockResolvedValue(mockResult);
      const result = await controller.cancelJadwal(bimbingan_id, datetime, dto);

      expect(service.cancelJadwal).toHaveBeenCalledWith(bimbingan_id, datetime, dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('doneJadwal', () => {
    it('should mark jadwal as done', async () => {
      const bimbingan_id = '1';
      const datetime = '2024-01-01T10:00:00';
      const dto: ResponseJadwal = { note_dosen: 'Completed' };
      const mockResult = { success: true };

      mockJadwalService.doneJadwal.mockResolvedValue(mockResult);
      const result = await controller.doneJadwal(bimbingan_id, datetime, dto);

      expect(service.doneJadwal).toHaveBeenCalledWith(bimbingan_id, datetime, dto);
      expect(result).toEqual(mockResult);
    });
  });
});