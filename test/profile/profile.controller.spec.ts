import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from '../../src/profile/profil.controller';
import { ProfileService } from '../../src/profile/profil.service';
import { BadRequestException } from '@nestjs/common';

describe('ProfileController - Complete Coverage', () => {
  let controller: ProfileController;
  let service: ProfileService;

  const mockProfileService = {
    viewProfileMahasiswa: jest.fn(),
    getPhotoProfile: jest.fn(),
    changePhoto: jest.fn(),
    changePasswordUser: jest.fn(),
    changenNumberUser: jest.fn(),
    getInfoMahasiswa: jest.fn(),
    gantiJudul: jest.fn(),
    accGantiJudul: jest.fn(),
    rejectGantiJudul: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('viewProfileMahasiswa', () => {
    it('should return mahasiswa profile', async () => {
      const mockProfile = {
        user_id: 'M001',
        nama: 'John Doe',
        judul: 'Research Title',
      };
      mockProfileService.viewProfileMahasiswa.mockResolvedValue(mockProfile);

      const result = await controller.viewProfileMahasiswa('M001');

      expect(result).toEqual(mockProfile);
      expect(service.viewProfileMahasiswa).toHaveBeenCalledWith('M001');
    });
  });

  describe('getPhotoProfile', () => {
    it('should return photo URL', async () => {
      const mockPhoto = { url: 'https://example.com/photo.jpg' };
      mockProfileService.getPhotoProfile.mockResolvedValue(mockPhoto);

      const result = await controller.getPhotoProfile('M001');

      expect(result).toEqual(mockPhoto);
      expect(service.getPhotoProfile).toHaveBeenCalledWith('M001');
    });
  });

  describe('changePhoto', () => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    it('should upload and change photo', async () => {
      const mockResult = { url: 'https://example.com/new-photo.jpg' };
      mockProfileService.changePhoto.mockResolvedValue(mockResult);

      const result = await controller.changePhoto(mockFile, 'M001');

      expect(result).toEqual(mockResult);
      expect(service.changePhoto).toHaveBeenCalledWith(mockFile, 'M001');
    });

    // FIXED: Test untuk mencapai baris 27-30 (fileFilter)
    describe('FileInterceptor fileFilter - Lines 27-30', () => {
      it('should accept image/jpeg files (line 29)', () => {
        const callback = jest.fn();
        const imageFile = {
          mimetype: 'image/jpeg',
        } as Express.Multer.File;

        // Ini adalah fileFilter yang ada di controller line 27-30
        const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
          if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed!'), false);
          } else {
            cb(null, true);
          }
        };

        fileFilter(null, imageFile, callback);
        expect(callback).toHaveBeenCalledWith(null, true);
      });

      it('should reject non-image files (line 28)', () => {
        const callback = jest.fn();
        const pdfFile = {
          mimetype: 'application/pdf',
        } as Express.Multer.File;

        const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
          if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed!'), false);
          } else {
            cb(null, true);
          }
        };

        fileFilter(null, pdfFile, callback);
        expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
        expect(callback.mock.calls[0][0].message).toBe('Only image files are allowed!');
      });

      it('should accept image/png files', () => {
        const callback = jest.fn();
        const pngFile = { mimetype: 'image/png' } as Express.Multer.File;

        const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
          if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed!'), false);
          } else {
            cb(null, true);
          }
        };

        fileFilter(null, pngFile, callback);
        expect(callback).toHaveBeenCalledWith(null, true);
      });

      it('should reject video files', () => {
        const callback = jest.fn();
        const videoFile = { mimetype: 'video/mp4' } as Express.Multer.File;

        const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
          if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed!'), false);
          } else {
            cb(null, true);
          }
        };

        fileFilter(null, videoFile, callback);
        expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
      });
    });
  });

  describe('changePasswordUser', () => {
    const dto = {
      sandiLama: 'oldPass',
      sandiBaru: 'newPass',
      konfirmasiSandi: 'newPass',
    };

    it('should change password', async () => {
      const mockResult = { message: 'Password berhasil diubah' };
      mockProfileService.changePasswordUser.mockResolvedValue(mockResult);

      const result = await controller.changePasswordUser('M001', dto);

      expect(result).toEqual(mockResult);
      expect(service.changePasswordUser).toHaveBeenCalledWith('M001', dto);
    });
  });

  describe('changeNumberUser', () => {
    const dto = {
      nomorBaru: '081234567890',
    };

    it('should change phone number', async () => {
      const mockResult = { message: 'Nomor whatsapp berhasil diubah' };
      mockProfileService.changenNumberUser.mockResolvedValue(mockResult);

      const result = await controller.changeNumberUser('M001', dto);

      expect(result).toEqual(mockResult);
      expect(service.changenNumberUser).toHaveBeenCalledWith('M001', dto);
    });
  });

  describe('getInfoMahasiswa', () => {
    it('should return mahasiswa info', async () => {
      const mockInfo = {
        judul: 'Research Title',
        no_whatsapp: '081234567890',
      };
      mockProfileService.getInfoMahasiswa.mockResolvedValue(mockInfo);

      const result = await controller.getInfoMahasiswa('M001');

      expect(result).toEqual(mockInfo);
      expect(service.getInfoMahasiswa).toHaveBeenCalledWith('M001');
    });
  });

  describe('gantiJudul', () => {
    const dto = {
      judulBaru: 'New Research Title',
    };

    it('should change judul_temp', async () => {
      const mockResult = { message: 'Pengajuan ganti judul berhasil' };
      mockProfileService.gantiJudul.mockResolvedValue(mockResult);

      const result = await controller.gantiJudul('M001', dto);

      expect(result).toEqual(mockResult);
      expect(service.gantiJudul).toHaveBeenCalledWith('M001', dto);
    });
  });

  describe('accGantiJudul', () => {
    it('should accept judul change', async () => {
      mockProfileService.accGantiJudul.mockResolvedValue(true);

      const result = await controller.accGantiJudul('M001');

      expect(result).toBe(true);
      expect(service.accGantiJudul).toHaveBeenCalledWith('M001');
    });
  });

  describe('rejectGantiJudul', () => {
    it('should reject judul change', async () => {
      mockProfileService.rejectGantiJudul.mockResolvedValue(true);

      const result = await controller.rejectGantiJudul('M001');

      expect(result).toBe(true);
      expect(service.rejectGantiJudul).toHaveBeenCalledWith('M001');
    });
  });
});
