import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('path', () => ({
  extname: jest.fn((filename: string) => {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }),
}));

describe('SupabaseService', () => {
  let service: SupabaseService;
  let mockSupabaseClient: any;

  beforeEach(async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_KEY = 'test-key';

    const mockStorageChain = {
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
    };

    const mockStorage = {
      from: jest.fn().mockReturnValue(mockStorageChain),
    };

    mockSupabaseClient = {
      storage: mockStorage,
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [SupabaseService],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_KEY;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Constructor', () => {
    it('should create supabase client with environment variables', () => {
      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key'
      );
    });

    it('should not create client if environment variables are missing', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_KEY;

      (createClient as jest.Mock).mockClear();

      const module = Test.createTestingModule({
        providers: [SupabaseService],
      }).compile();

      expect(createClient).not.toHaveBeenCalled();
    });

    it('should not create client if only SUPABASE_URL is present', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.SUPABASE_KEY;

      (createClient as jest.Mock).mockClear();

      new SupabaseService();

      expect(createClient).not.toHaveBeenCalled();
    });

    it('should not create client if only SUPABASE_KEY is present', () => {
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_KEY = 'test-key';

      (createClient as jest.Mock).mockClear();

      new SupabaseService();

      expect(createClient).not.toHaveBeenCalled();
    });
  });

  describe('uploadProgressFile', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('test file content'),
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    it('should upload progress file successfully', async () => {
      const mockPublicUrl = 'https://test.supabase.co/storage/v1/object/public/bimta/progress/20240101120000.pdf';

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'progress/20240101120000.pdf' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = await service.uploadProgressFile(mockFile);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('bimta');
      expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalledWith(
        expect.stringContaining('progress/'),
        mockFile.buffer,
        {
          contentType: 'application/pdf',
          upsert: false,
        }
      );
      expect(result).toHaveProperty('publicUrl', mockPublicUrl);
      expect(result).toHaveProperty('filename');
      expect(result.filename).toMatch(/^\d{14}\.pdf$/);
    });

    it('should upload to custom folder', async () => {
      const customFolder = 'custom-folder';
      const mockPublicUrl = 'https://test.supabase.co/storage/v1/object/public/bimta/custom-folder/file.pdf';

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: `${customFolder}/file.pdf` },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      await service.uploadProgressFile(mockFile, customFolder);

      expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalledWith(
        expect.stringContaining(`${customFolder}/`),
        expect.any(Buffer),
        expect.any(Object)
      );
    });

    it('should generate unique filename with timestamp', async () => {
      const mockPublicUrl = 'https://test.supabase.co/storage/v1/object/public/bimta/progress/file.pdf';

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'progress/20240101120000.pdf' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = await service.uploadProgressFile(mockFile);

      expect(result.filename).toMatch(/^\d{14}\.(pdf|docx|txt)$/);
    });

    it('should handle different file types', async () => {
      const imageFile: Express.Multer.File = {
        ...mockFile,
        originalname: 'image.png',
        mimetype: 'image/png',
      };

      const mockPublicUrl = 'https://test.supabase.co/storage/v1/object/public/bimta/progress/file.png';

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'progress/file.png' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      await service.uploadProgressFile(imageFile);

      expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalledWith(
        expect.any(String),
        imageFile.buffer,
        {
          contentType: 'image/png',
          upsert: false,
        }
      );
    });

    it('should throw InternalServerErrorException on upload error', async () => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      await expect(service.uploadProgressFile(mockFile)).rejects.toThrow(
        InternalServerErrorException
      );

      await expect(service.uploadProgressFile(mockFile)).rejects.toThrow(
        'Terjadi kesalahan saat upload file'
      );
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      mockSupabaseClient.storage.from().upload.mockRejectedValue(
        new Error('Network error')
      );

      await expect(service.uploadProgressFile(mockFile)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(service.uploadProgressFile(mockFile)).rejects.toThrow(
        'Terjadi kesalahan saat upload file'
      );
    });

    it('should use upsert: false to prevent overwriting', async () => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'progress/file.pdf' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'url' },
      });

      await service.uploadProgressFile(mockFile);

      expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer),
        expect.objectContaining({ upsert: false })
      );
    });
  });

  describe('uploadPhoto', () => {
    const mockPhotoFile: Express.Multer.File = {
      fieldname: 'photo',
      originalname: 'profile.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 2048,
      buffer: Buffer.from('image data'),
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    it('should upload photo successfully', async () => {
      const mockPublicUrl = 'https://test.supabase.co/storage/v1/object/public/bimta/profil/20240101120000.jpg';

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'profil/20240101120000.jpg' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = await service.uploadPhoto(mockPhotoFile);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('bimta');
      expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalledWith(
        expect.stringContaining('profil/'),
        mockPhotoFile.buffer,
        {
          contentType: 'image/jpeg',
          upsert: false,
        }
      );
      expect(result).toBe(mockPublicUrl);
    });

    it('should upload to custom folder', async () => {
      const customFolder = 'avatars';
      const mockPublicUrl = 'https://test.supabase.co/storage/v1/object/public/bimta/avatars/photo.jpg';

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: `${customFolder}/photo.jpg` },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      await service.uploadPhoto(mockPhotoFile, customFolder);

      expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalledWith(
        expect.stringContaining(`${customFolder}/`),
        expect.any(Buffer),
        expect.any(Object)
      );
    });

    it('should return only publicUrl string', async () => {
      const mockPublicUrl = 'https://test.supabase.co/storage/v1/object/public/bimta/profil/photo.jpg';

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'profil/photo.jpg' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = await service.uploadPhoto(mockPhotoFile);

      expect(typeof result).toBe('string');
      expect(result).toBe(mockPublicUrl);
    });

    it('should handle different image formats', async () => {
      const pngFile: Express.Multer.File = {
        ...mockPhotoFile,
        originalname: 'photo.png',
        mimetype: 'image/png',
      };

      const mockPublicUrl = 'https://test.supabase.co/storage/v1/object/public/bimta/profil/photo.png';

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'profil/photo.png' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      await service.uploadPhoto(pngFile);

      expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalledWith(
        expect.stringContaining('.png'),
        pngFile.buffer,
        expect.objectContaining({
          contentType: 'image/png',
        })
      );
    });

    it('should throw InternalServerErrorException on upload error', async () => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      await expect(service.uploadPhoto(mockPhotoFile)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(service.uploadPhoto(mockPhotoFile)).rejects.toThrow(
        'Terjadi kesalahan saat upload file'
      );
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      mockSupabaseClient.storage.from().upload.mockRejectedValue(
        new Error('Network error')
      );

      await expect(service.uploadPhoto(mockPhotoFile)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(service.uploadPhoto(mockPhotoFile)).rejects.toThrow(
        'Terjadi kesalahan saat upload file'
      );
    });

    it('should generate unique filename with timestamp', async () => {
      mockSupabaseClient.storage.from().upload.mockImplementation((filepath) => {
        expect(filepath).toMatch(/profil\/\d{14}\.(jpg|png|jpeg)$/);
        return Promise.resolve({ data: { path: filepath }, error: null });
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'url' },
      });

      await service.uploadPhoto(mockPhotoFile);

      expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalled();
    });
  });

  describe('downloadFile', () => {
    it('should throw error as method not implemented', () => {
      expect(() => service.downloadFile('bucket', 'path')).toThrow(
        'Method not implemented.'
      );
    });
  });

  describe('Error Handling Edge Cases', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('test'),
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    it('should handle Supabase error with custom message', async () => {
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'File size too large' },
      });

      await expect(service.uploadProgressFile(mockFile)).rejects.toThrow(
        'Terjadi kesalahan saat upload file'
      );
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Test error' },
      });

      await expect(service.uploadProgressFile(mockFile)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Upload failed:',
        'Test error'
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle file without extension', async () => {
      const fileNoExt: Express.Multer.File = {
        ...mockFile,
        originalname: 'file',
      };

      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'progress/file' },
        error: null,
      });

      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'url' },
      });

      const result = await service.uploadProgressFile(fileNoExt);

      expect(result.filename).toMatch(/^\d{14}$/);
    });
  });
});