import { Test, TestingModule } from '@nestjs/testing';
import { GeneralController } from '../../src/general/general.controller';
import { GeneralService } from '../../src/general/general.service';

describe('GeneralController', () => {
  let controller: GeneralController;
  let service: GeneralService;

  const mockService = {
    referensiTa: jest.fn(),
    mahasiswa: jest.fn(),
    terkiniMahasiswa: jest.fn(),
    terkiniDosen: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneralController],
      providers: [
        {
          provide: GeneralService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<GeneralController>(GeneralController);
    service = module.get<GeneralService>(GeneralService);

    jest.clearAllMocks();
  });

  describe('ReferensiTa', () => {
    it('should return referensi TA from service', async () => {
      const mockData = [
        {
          nim_mahasiswa: '2111522001',
          nama_mahasiswa: 'Ahmad Hidayat',
          topik: 'Machine Learning',
          judul: 'Implementasi ML',
          tahun: 2023,
          doc_url: 'https://github.com'
        }
      ];
      mockService.referensiTa.mockResolvedValue(mockData);

      const result = await controller.ReferensiTa();

      expect(result).toEqual(mockData);
      expect(mockService.referensiTa).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no referensi TA', async () => {
      mockService.referensiTa.mockResolvedValue([]);

      const result = await controller.ReferensiTa();

      expect(result).toEqual([]);
      expect(mockService.referensiTa).toHaveBeenCalledTimes(1);
    });
  });

  describe('mahasiswa', () => {
    it('should return mahasiswa from service', async () => {
      const mockData = [
        { user_id: '2211522023', nama: 'talita zulfa amira' }
      ];
      mockService.mahasiswa.mockResolvedValue(mockData);

      const result = await controller.mahasiswa('0909090909');

      expect(result).toEqual(mockData);
      expect(mockService.mahasiswa).toHaveBeenCalledWith('0909090909');
    });

    it('should return empty array when no mahasiswa available', async () => {
      mockService.mahasiswa.mockResolvedValue([]);

      const result = await controller.mahasiswa('0909090909');

      expect(result).toEqual([]);
      expect(mockService.mahasiswa).toHaveBeenCalledWith('0909090909');
    });
  });

  describe('terkiniMahasiswa', () => {
    it('should return terkini activities from service', async () => {
      const mockData = [
        {
          progress_id: 'prog-001',
          nama: 'BAB I - Pendahuluan',
          tanggal: new Date('2024-01-16T14:00:00Z'),
          icon: 'progress'
        }
      ];
      mockService.terkiniMahasiswa.mockResolvedValue(mockData);

      const result = await controller.terkiniMahasiswa('2211522023');

      expect(result).toEqual(mockData);
      expect(mockService.terkiniMahasiswa).toHaveBeenCalledWith('2211522023');
    });

    it('should return empty array when no activities', async () => {
      mockService.terkiniMahasiswa.mockResolvedValue([]);

      const result = await controller.terkiniMahasiswa('2211522023');

      expect(result).toEqual([]);
      expect(mockService.terkiniMahasiswa).toHaveBeenCalledWith('2211522023');
    });
  });

  describe('terkiniDosen', () => {
    it('should return terkini activities from service', async () => {
      const mockData = [
        {
          progress_id: 'prog-002',
          nama: 'BAB II - Tinjauan Pustaka',
          tanggal: new Date('2024-01-20T10:00:00Z'),
          icon: 'progress'
        }
      ];
      mockService.terkiniDosen.mockResolvedValue(mockData);

      const result = await controller.terkiniDosen('0909090909');

      expect(result).toEqual(mockData);
      expect(mockService.terkiniDosen).toHaveBeenCalledWith('0909090909');
    });

    it('should return empty array when no activities', async () => {
      mockService.terkiniDosen.mockResolvedValue([]);

      const result = await controller.terkiniDosen('0909090909');

      expect(result).toEqual([]);
      expect(mockService.terkiniDosen).toHaveBeenCalledWith('0909090909');
    });
  });
});