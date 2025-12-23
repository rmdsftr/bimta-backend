import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from '../../src/profile/profil.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SupabaseService } from '../../src/supabase/supabase.service';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('ProfileService - Complete Coverage', () => {
  let service: ProfileService;
  let prisma: any;
  let supabase: any;

  // FIXED: Declare mock outside to be accessible
  let mockPrismaService: any;
  let mockSupabaseService: any;

  beforeEach(async () => {
    // FIXED: Initialize mock inside beforeEach
    mockPrismaService = {
      users: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      bimbingan: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };

    mockSupabaseService = {
      uploadPhoto: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prisma = mockPrismaService; // FIXED: Assign directly
    supabase = mockSupabaseService; // FIXED: Assign directly

    // Mock console to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('viewProfileMahasiswa', () => {
    const mahasiswaId = 'M001';
    const mockMahasiswa = {
      user_id: 'M001',
      nama: 'John Doe',
      judul: 'Penelitian AI',
      photo_url: 'https://example.com/photo.jpg',
      judul_temp: 'Penelitian ML',
      bimbingan_bimbingan_mahasiswa_idTousers: [
        { status_bimbingan: 'ongoing' },
        { status_bimbingan: 'ongoing' },
      ],
    };

    it('should return mahasiswa profile data', async () => {
      mockPrismaService.users.findFirst.mockResolvedValue(mockMahasiswa);

      const result = await service.viewProfileMahasiswa(mahasiswaId);

      expect(result).toEqual({
        user_id: 'M001',
        nama: 'John Doe',
        judul: 'Penelitian AI',
        photo_url: 'https://example.com/photo.jpg',
        judul_temp: 'Penelitian ML',
        status_bimbingan: ['ongoing', 'ongoing'],
      });
    });

    it('should handle mahasiswa with no bimbingan', async () => {
      const mahasiswaWithoutBimbingan = {
        ...mockMahasiswa,
        bimbingan_bimbingan_mahasiswa_idTousers: [],
      };
      mockPrismaService.users.findFirst.mockResolvedValue(
        mahasiswaWithoutBimbingan,
      );

      const result = await service.viewProfileMahasiswa(mahasiswaId);

      expect(result.status_bimbingan).toEqual([]);
    });

    it('should handle null photo_url', async () => {
      const mahasiswaNoPhoto = {
        ...mockMahasiswa,
        photo_url: null,
      };
      mockPrismaService.users.findFirst.mockResolvedValue(mahasiswaNoPhoto);

      const result = await service.viewProfileMahasiswa(mahasiswaId);

      expect(result.photo_url).toBeNull();
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      mockPrismaService.users.findFirst.mockRejectedValue('String error');

      await expect(service.viewProfileMahasiswa(mahasiswaId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException for null error', async () => {
      mockPrismaService.users.findFirst.mockRejectedValue(null);

      await expect(service.viewProfileMahasiswa(mahasiswaId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should rethrow Error instances', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.users.findFirst.mockRejectedValue(dbError);

      await expect(service.viewProfileMahasiswa(mahasiswaId)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('changePhoto', () => {
    const userId = 'M001';
    const mockFile = {
      fieldname: 'file',
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    it('should successfully upload and update photo', async () => {
      const photoUrl = 'https://example.com/new-photo.jpg';
      mockSupabaseService.uploadPhoto.mockResolvedValue(photoUrl);
      mockPrismaService.users.update.mockResolvedValue({});

      const result = await service.changePhoto(mockFile, userId);

      expect(result).toEqual({ url: photoUrl });
      expect(mockSupabaseService.uploadPhoto).toHaveBeenCalledWith(mockFile);
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { user_id: userId },
        data: { photo_url: photoUrl },
      });
    });

    it('should throw error if upload fails', async () => {
      mockSupabaseService.uploadPhoto.mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(service.changePhoto(mockFile, userId)).rejects.toThrow(
        'Upload failed',
      );
      expect(mockPrismaService.users.update).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      mockSupabaseService.uploadPhoto.mockRejectedValue('Upload error');

      await expect(service.changePhoto(mockFile, userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw error if database update fails', async () => {
      mockSupabaseService.uploadPhoto.mockResolvedValue(
        'https://example.com/photo.jpg',
      );
      mockPrismaService.users.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.changePhoto(mockFile, userId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getPhotoProfile', () => {
    const userId = 'M001';

    it('should return photo URL', async () => {
      mockPrismaService.users.findFirst.mockResolvedValue({
        photo_url: 'https://example.com/photo.jpg',
      });

      const result = await service.getPhotoProfile(userId);

      expect(result).toEqual({ url: 'https://example.com/photo.jpg' });
    });

    it('should return null if no photo', async () => {
      mockPrismaService.users.findFirst.mockResolvedValue({
        photo_url: null,
      });

      const result = await service.getPhotoProfile(userId);

      expect(result).toEqual({ url: null });
    });

    it('should return null if user not found', async () => {
      mockPrismaService.users.findFirst.mockResolvedValue(null);

      const result = await service.getPhotoProfile(userId);

      expect(result).toEqual({ url: null });
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      mockPrismaService.users.findFirst.mockRejectedValue(404);

      await expect(service.getPhotoProfile(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should rethrow Error instances', async () => {
      mockPrismaService.users.findFirst.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getPhotoProfile(userId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('changePasswordUser', () => {
    const userId = 'M001';
    const dto = {
      sandiLama: 'oldPassword123',
      sandiBaru: 'newPassword456',
      konfirmasiSandi: 'newPassword456',
    };

    beforeEach(() => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');
    });

    it('should successfully change password', async () => {
      mockPrismaService.users.findFirst.mockResolvedValue({
        sandi: 'hashedOldPassword',
      });
      mockPrismaService.users.update.mockResolvedValue({});

      const result = await service.changePasswordUser(userId, dto);

      expect(result).toEqual({ message: 'Password berhasil diubah' });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'oldPassword123',
        'hashedOldPassword',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword456', 12);
    });

    it('should throw BadRequestException if old password does not match', async () => {
      mockPrismaService.users.findFirst.mockResolvedValue({
        sandi: 'hashedOldPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePasswordUser(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.changePasswordUser(userId, dto)).rejects.toThrow(
        'Sandi lama tidak cocok',
      );
      expect(mockPrismaService.users.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if new passwords do not match', async () => {
      mockPrismaService.users.findFirst.mockResolvedValue({
        sandi: 'hashedOldPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const dtoMismatch = {
        ...dto,
        konfirmasiSandi: 'differentPassword',
      };

      await expect(
        service.changePasswordUser(userId, dtoMismatch),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePasswordUser(userId, dtoMismatch),
      ).rejects.toThrow('Sandi baru dan konfirmasi tidak sesuai');
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      mockPrismaService.users.findFirst.mockRejectedValue({ code: 'P2025' });

      await expect(service.changePasswordUser(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should rethrow Error instances', async () => {
      mockPrismaService.users.findFirst.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.changePasswordUser(userId, dto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('changenNumberUser', () => {
    const userId = 'M001';
    const dto = {
      nomorBaru: '081234567890',
    };

    it('should successfully change phone number', async () => {
      mockPrismaService.users.update.mockResolvedValue({});

      const result = await service.changenNumberUser(userId, dto);

      expect(result).toEqual({ message: 'Nomor whatsapp berhasil diubah' });
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { user_id: userId },
        data: { no_whatsapp: '081234567890' },
      });
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      mockPrismaService.users.update.mockRejectedValue('Update failed');

      await expect(service.changenNumberUser(userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should rethrow Error instances', async () => {
      mockPrismaService.users.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.changenNumberUser(userId, dto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getInfoMahasiswa', () => {
    const mahasiswaId = 'M001';

    it('should return mahasiswa info', async () => {
      const mockInfo = {
        judul: 'Penelitian AI',
        no_whatsapp: '081234567890',
      };
      mockPrismaService.users.findFirst.mockResolvedValue(mockInfo);

      const result = await service.getInfoMahasiswa(mahasiswaId);

      expect(result).toEqual(mockInfo);
    });

    it('should return null if mahasiswa not found', async () => {
      mockPrismaService.users.findFirst.mockResolvedValue(null);

      const result = await service.getInfoMahasiswa(mahasiswaId);

      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      mockPrismaService.users.findFirst.mockRejectedValue([1, 2, 3]);

      await expect(service.getInfoMahasiswa(mahasiswaId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should rethrow Error instances', async () => {
      mockPrismaService.users.findFirst.mockRejectedValue(
        new Error('Connection timeout'),
      );

      await expect(service.getInfoMahasiswa(mahasiswaId)).rejects.toThrow(
        'Connection timeout',
      );
    });
  });

  // ===============================================================
  // TEST: gantiJudul() - FIXED
  // ===============================================================
  describe('gantiJudul', () => {
    const mahasiswaId = 'M001';
    const dto = {
      judulBaru: 'Penelitian Machine Learning',
    };

    it('should successfully update judul_temp', async () => {
      // FIXED: Mock bimbingan.findFirst terlebih dahulu
      const mockBimbingan = {
        bimbingan_id: 'BIM123',
        mahasiswa_id: mahasiswaId,
        dosen_id: 'DOS123',
      };

      mockPrismaService.bimbingan.findFirst.mockResolvedValue(mockBimbingan);
      mockPrismaService.users.update.mockResolvedValue({
        user_id: mahasiswaId,
        judul_temp: dto.judulBaru,
      });

      const result = await service.gantiJudul(mahasiswaId, dto);

      expect(result).toEqual({
        message: 'Pengajuan ganti judul berhasil. Menunggu persetujuan dosen pembimbing',
      });

      expect(mockPrismaService.bimbingan.findFirst).toHaveBeenCalledWith({
        where: { mahasiswa_id: mahasiswaId },
      });

      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { user_id: mahasiswaId },
        data: { judul_temp: 'Penelitian Machine Learning' },
      });
    });

    it('should throw BadRequestException when no bimbingan found', async () => {
      // FIXED: Mock bimbingan tidak ditemukan
      mockPrismaService.bimbingan.findFirst.mockResolvedValue(null);

      await expect(service.gantiJudul(mahasiswaId, dto)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.gantiJudul(mahasiswaId, dto)).rejects.toThrow(
        'Tidak dapat mengajukan ganti judul. Anda belum memiliki dosen pembimbing',
      );
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      // FIXED: Mock bimbingan berhasil dulu
      mockPrismaService.bimbingan.findFirst.mockResolvedValue({
        bimbingan_id: 'BIM123',
      });
      // Kemudian mock update gagal dengan non-Error
      mockPrismaService.users.update.mockRejectedValue(undefined);

      await expect(service.gantiJudul(mahasiswaId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should rethrow Error instances', async () => {
      // FIXED: Mock bimbingan berhasil dulu
      mockPrismaService.bimbingan.findFirst.mockResolvedValue({
        bimbingan_id: 'BIM123',
      });
      // Kemudian mock update gagal dengan Error
      mockPrismaService.users.update.mockRejectedValue(
        new Error('Invalid data'),
      );

      await expect(service.gantiJudul(mahasiswaId, dto)).rejects.toThrow(
        'Invalid data',
      );
    });
  });

  describe('accGantiJudul', () => {
    const mahasiswaId = 'M001';

    it('should successfully accept judul change', async () => {
      mockPrismaService.users.findFirst.mockResolvedValue({
        judul: 'Old Title',
        judul_temp: 'New Title',
      });
      mockPrismaService.users.update.mockResolvedValue({});

      const result = await service.accGantiJudul(mahasiswaId);

      expect(result).toBe(true);
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { user_id: mahasiswaId },
        data: {
          judul: 'New Title',
          judul_temp: '',
        },
      });
    });

    it('should handle null judul_temp', async () => {
      mockPrismaService.users.findFirst.mockResolvedValue({
        judul: 'Current Title',
        judul_temp: null,
      });
      mockPrismaService.users.update.mockResolvedValue({});

      const result = await service.accGantiJudul(mahasiswaId);

      expect(result).toBe(true);
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { user_id: mahasiswaId },
        data: {
          judul: null,
          judul_temp: '',
        },
      });
    });

    it('should throw InternalServerErrorException for non-Error exceptions', async () => {
      mockPrismaService.users.findFirst.mockRejectedValue(false);

      await expect(service.accGantiJudul(mahasiswaId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should rethrow Error instances', async () => {
      mockPrismaService.users.findFirst.mockRejectedValue(
        new Error('Query failed'),
      );

      await expect(service.accGantiJudul(mahasiswaId)).rejects.toThrow(
        'Query failed',
      );
    });
  });

  describe('rejectGantiJudul', () => {
    const mahasiswaId = 'M001';

    it('should successfully reject judul change', async () => {
      mockPrismaService.users.update.mockResolvedValue({});

      const result = await service.rejectGantiJudul(mahasiswaId);

      expect(result).toBe(true);
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { user_id: mahasiswaId },
        data: { judul_temp: '' },
      });
    });

    it('should handle update errors', async () => {
      mockPrismaService.users.update.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(service.rejectGantiJudul(mahasiswaId)).rejects.toThrow(
        'Update failed',
      );
    });
  });
});