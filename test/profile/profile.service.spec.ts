import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from '../../src/profile/profil.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SupabaseService } from '../../src/supabase/supabase.service';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('ProfileService (Mocked)', () => {
  let service: ProfileService;
  let prisma: PrismaService;
  let supabase: SupabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: {
            users: {
              findFirst: jest.fn(),
              update: jest.fn()
            }
          }
        },
        {
          provide: SupabaseService,
          useValue: {
            uploadPhoto: jest.fn()
          }
        }
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prisma = module.get<PrismaService>(PrismaService);
    supabase = module.get<SupabaseService>(SupabaseService);
  });

  
  describe('viewProfileMahasiswa', () => {
    it('should return formatted profile data', async () => {
      prisma.users.findFirst = jest.fn().mockResolvedValue({
        user_id: '123',
        nama: 'Tegar',
        judul: 'A',
        photo_url: null,
        judul_temp: 'B',
        bimbingan_bimbingan_mahasiswa_idTousers: [
          { status_bimbingan: 'disetujui' },
        ],
      });

      const result = await service.viewProfileMahasiswa('123');
      expect(result.nama).toBe('Tegar');
      expect(result.status_bimbingan).toEqual(['disetujui']);
    });
  });

  
  describe('changePhoto', () => {
    it('should upload file and update photo_url', async () => {
      supabase.uploadPhoto = jest.fn().mockResolvedValue('photo.jpg');
      prisma.users.update = jest.fn().mockResolvedValue({ photo_url: 'photo.jpg' });

      const result = await service.changePhoto({} as any, '123');
      expect(result).toEqual({ url: 'photo.jpg' });
    });
  });

  
  describe('getPhotoProfile', () => {
    it('should return photo_url', async () => {
      prisma.users.findFirst = jest.fn().mockResolvedValue({ photo_url: 'abc.png' });
      const result = await service.getPhotoProfile('1');

      expect(result).toEqual({ url: 'abc.png' });
    });
  });

  
  describe('changePasswordUser', () => {
    it('should throw error if old password mismatch', async () => {
      prisma.users.findFirst = jest.fn().mockResolvedValue({ sandi: await bcrypt.hash('old', 10) });

      const dto = { sandiLama: 'salah', sandiBaru: 'baru', konfirmasiSandi: 'baru' };

      await expect(service.changePasswordUser('1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should change password successfully', async () => {
      prisma.users.findFirst = jest.fn().mockResolvedValue({ sandi: await bcrypt.hash('old', 10) });
      prisma.users.update = jest.fn().mockResolvedValue(true);

      const dto = { sandiLama: 'old', sandiBaru: 'baru', konfirmasiSandi: 'baru' };

      const result = await service.changePasswordUser('1', dto);
      expect(result.message).toBe('Password berhasil diubah');
    });
  });

  
  describe('changenNumberUser', () => {
    it('should update phone number', async () => {
      prisma.users.update = jest.fn().mockResolvedValue(true);

      const result = await service.changenNumberUser('1', { nomorBaru: '0899' });
      expect(result.message).toBe('Nomor whatsapp berhasil diubah');
    });
  });

  
  describe('getInfoMahasiswa', () => {
    it('should return info object', async () => {
      prisma.users.findFirst = jest.fn().mockResolvedValue({
        judul: 'Proposal',
        no_whatsapp: '0899'
      });

      const result = await service.getInfoMahasiswa('1');
      expect(result!.judul).toBe('Proposal');
    });
  });

  
  describe('gantiJudul', () => {
    it('should update temp title', async () => {
      prisma.users.update = jest.fn().mockResolvedValue(true);
      await service.gantiJudul('1', { judulBaru: 'Baru' });

      expect(prisma.users.update).toHaveBeenCalled();
    });
  });

  
  describe('accGantiJudul', () => {
    it('should accept title change and clear temp', async () => {
      prisma.users.findFirst = jest.fn().mockResolvedValue({
        judul: 'Lama',
        judul_temp: 'Baru',
      });

      prisma.users.update = jest.fn().mockResolvedValue(true);

      const result = await service.accGantiJudul('1');
      expect(result).toBe(true);
    });
  });

  
  describe('rejectGantiJudul', () => {
    it('should clear judul_temp', async () => {
      prisma.users.update = jest.fn().mockResolvedValue(true);
      const result = await service.rejectGantiJudul('1');

      expect(result).toBe(true);
    });
  });
});