import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from '../../src/profile/profil.controller';
import { ProfileService } from '../../src/profile/profil.service';

describe('ProfileController (Mocked)', () => {
  let controller: ProfileController;
  let service: ProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: {
            viewProfileMahasiswa: jest.fn(),
            getPhotoProfile: jest.fn(),
            changePhoto: jest.fn(),
            changePasswordUser: jest.fn(),
            changenNumberUser: jest.fn(),
            getInfoMahasiswa: jest.fn(),
            gantiJudul: jest.fn(),
            accGantiJudul: jest.fn(),
            rejectGantiJudul: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ProfileController);
    service = module.get(ProfileService);
  });


  // GET VIEW PROFILE
  describe('viewProfileMahasiswa', () => {
    it('should call service and return result', async () => {
      (service.viewProfileMahasiswa as jest.Mock).mockResolvedValue('data');

      const result = await controller.viewProfileMahasiswa('1');

      expect(result).toBe('data');
      expect(service.viewProfileMahasiswa).toHaveBeenCalledWith('1');
    });
  });


  // GET PHOTO
  describe('getPhotoProfile', () => {
    it('should return photo', async () => {
      (service.getPhotoProfile as jest.Mock).mockResolvedValue('photo.png');

      const result = await controller.getPhotoProfile('5');

      expect(result).toBe('photo.png');
      expect(service.getPhotoProfile).toHaveBeenCalledWith('5');
    });
  });


  // CHANGE PHOTO
  describe('changePhoto', () => {
    it('should update photo', async () => {
      (service.changePhoto as jest.Mock).mockResolvedValue('updated.png');

      const result = await controller.changePhoto({} as any, '1');

      expect(result).toBe('updated.png');
    });
  });


  // CHANGE PASSWORD
  describe('changePasswordUser', () => {
    it('should return success message', async () => {
      (service.changePasswordUser as jest.Mock).mockResolvedValue({
        message: 'ok',
      });

      const result = await controller.changePasswordUser('1', {
        sandiLama: 'a',
        sandiBaru: 'b',
        konfirmasiSandi: 'b',
      });

      expect(result.message).toBe('ok');
      expect(service.changePasswordUser).toHaveBeenCalled();
    });
  });

  
  // CHANGE NUMBER
  describe('changeNumberUser', () => {
    it('should return success message', async () => {
      (service.changenNumberUser as jest.Mock).mockResolvedValue({
        message: 'done',
      });

      const result = await controller.changeNumberUser('1', { nomorBaru: '0899' });

      expect(result.message).toBe('done');
    });
  });

 
  // GET INFO MAHASISWA
  describe('getInfoMahasiswa', () => {
    it('should call service', async () => {
      (service.getInfoMahasiswa as jest.Mock).mockResolvedValue({});

      await controller.getInfoMahasiswa('1');

      expect(service.getInfoMahasiswa).toHaveBeenCalledWith('1');
    });
  });


  // GANTI JUDUL
  describe('gantiJudul', () => {
    it('should return true', async () => {
      (service.gantiJudul as jest.Mock).mockResolvedValue(true);

      const res = await controller.gantiJudul('1', { judulBaru: 'Baru' });

      expect(res).toBe(true);
    });
  });


  // ACC GANTI JUDUL
  describe('accGantiJudul', () => {
    it('should approve judul', async () => {
      (service.accGantiJudul as jest.Mock).mockResolvedValue(true);

      const res = await controller.accGantiJudul('1');

      expect(res).toBe(true);
    });
  });


  // REJECT GANTI JUDUL
  describe('rejectGantiJudul', () => {
    it('should reject judul', async () => {
      (service.rejectGantiJudul as jest.Mock).mockResolvedValue(true);

      const res = await controller.rejectGantiJudul('1');

      expect(res).toBe(true);
    });
  });
});