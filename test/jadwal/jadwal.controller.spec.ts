import { Test, TestingModule } from '@nestjs/testing';
import { JadwalController } from '../../src/jadwal/jadwal.controller';
import { JadwalService } from '../../src/jadwal/jadwal.service';

describe('JadwalController', () => {
  let controller: JadwalController;
  let service: JadwalService;

  const mockService = {
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
      providers: [{ provide: JadwalService, useValue: mockService }],
    }).compile();

    controller = module.get<JadwalController>(JadwalController);
    service = module.get<JadwalService>(JadwalService);
  });

  it('should add jadwal', async () => {
    mockService.addJadwal.mockResolvedValue({ count: 1 });

    const dto = {
      judul: 'Topik',
      tanggal: '2025-01-01',
      waktu: '08:00',
      lokasi: 'Ruang A',
      pesan: 'Test',
    };

    const result = await controller.addJadwal(dto, 'M1');

    expect(result).toEqual({ count: 1 });
    expect(service.addJadwal).toHaveBeenCalled();
  });

  it('should get jadwal mahasiswa', async () => {
    mockService.viewJadwal.mockResolvedValue([]);

    await controller.viewJadwal('M1');

    expect(service.viewJadwal).toHaveBeenCalledWith('M1');
  });

  it('should get jadwal dosen', async () => {
    mockService.getJadwalDosen.mockResolvedValue([]);

    await controller.getJadwalDosen('D1');

    expect(service.getJadwalDosen).toHaveBeenCalledWith('D1');
  });

  it('should accept jadwal', async () => {
    mockService.acceptedJadwal.mockResolvedValue({ message: 'OK' });

    const result = await controller.acceptedJadwal('B1', '2025', {
      note_dosen: 'ya',
    });

    expect(result).toEqual({ message: 'OK' });
  });
});
