import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtTokenUtil } from '../../src/utils/jwt_token';
import { UserValidator } from '../../src/validators/user.validator';
import {
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService - Complete Coverage', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtTokenUtil: JwtTokenUtil;
  let userValidator: UserValidator;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtTokenUtil = {
    generateTokens: jest.fn(),
  };

  const mockUserValidator = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtTokenUtil,
          useValue: mockJwtTokenUtil,
        },
        {
          provide: UserValidator,
          useValue: mockUserValidator,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtTokenUtil = module.get<JwtTokenUtil>(JwtTokenUtil);
    userValidator = module.get<UserValidator>(UserValidator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      user_id: 'D001',
      nama: 'john doe',
      no_whatsapp: '081234567890',
      role: 'dosen' as const,
    };

    const mockNewUser = {
      user_id: 'D001',
      nama: 'John Doe',
      no_whatsapp: '081234567890',
      sandi: 'hashedPassword',
      status_user: 'active',
      role: 'dosen',
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    });

    it('should successfully register a new user', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue(mockNewUser);

      const result = await service.register(registerDto);

      expect(result).toEqual(mockNewUser);
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { user_id: 'D001' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('D001', 12);
      expect(prisma.users.create).toHaveBeenCalledWith({
        data: {
          user_id: 'D001',
          nama: 'John Doe',
          no_whatsapp: '081234567890',
          sandi: 'hashedPassword',
          status_user: 'active',
          role: 'dosen',
        },
      });
    });

    it('should handle user_id with whitespace', async () => {
      const dtoWithSpaces = {
        ...registerDto,
        user_id: '  D001  ',
        no_whatsapp: '  081234567890  ',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue(mockNewUser);

      await service.register(dtoWithSpaces);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { user_id: 'D001' },
      });
      expect(prisma.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'D001',
          no_whatsapp: '081234567890',
        }),
      });
    });

    it('should convert nama to title case', async () => {
      const dtoLowerCase = {
        ...registerDto,
        nama: 'john doe smith',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue({
        ...mockNewUser,
        nama: 'John Doe Smith',
      });

      const result = await service.register(dtoLowerCase);

      expect(prisma.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nama: 'John Doe Smith',
        }),
      });
    });

    it('should throw BadRequestException if user already exists', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockNewUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'User sudah terdaftar',
      );
      expect(prisma.users.create).not.toHaveBeenCalled();
    });

    it('should throw error if bcrypt.hash fails', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash failed'));

      await expect(service.register(registerDto)).rejects.toThrow('Hash failed');
    });

    it('should throw InternalServerErrorException for database errors', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    // LINE 46-47: Test non-Error instance in catch block
    it('should handle non-Error exceptions in catch block', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue('String error');

      await expect(service.register(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Terjadi kesalahan pada server',
      );
    });

    it('should handle null/undefined errors', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle numeric errors', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue(500);

      await expect(service.register(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle object errors without Error prototype', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue({ code: 'P2002' });

      await expect(service.register(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      user_id: 'D001',
      sandi: 'password123',
    };

    const mockUser = {
      user_id: 'D001',
      nama: 'John Doe',
      role: 'dosen',
      sandi: 'hashedPassword',
    };

    const mockPayload = {
      user_id: 'D001',
      nama: 'John Doe',
      role: 'dosen',
    };

    const mockTokens = {
      access_token: 'access.token.here',
      refresh_token: 'refresh.token.here',
    };

    beforeEach(() => {
      // Mock console.log to avoid cluttering test output
      jest.spyOn(console, 'log').mockImplementation();
    });

    it('should successfully login with valid credentials', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserValidator.validateUser.mockResolvedValue(mockPayload);
      mockJwtTokenUtil.generateTokens.mockResolvedValue(mockTokens);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        message: 'Login berhasil',
        data: {
          user_id: 'D001',
          nama: 'John Doe',
          role: 'dosen',
          access_token: 'access.token.here',
          refresh_token: 'refresh.token.here',
        },
      });
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { user_id: 'D001' },
        select: {
          sandi: true,
          role: true,
          nama: true,
          user_id: true,
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    });

    it('should handle user_id with whitespace', async () => {
      const dtoWithSpaces = {
        ...loginDto,
        user_id: '  D001  ',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserValidator.validateUser.mockResolvedValue(mockPayload);
      mockJwtTokenUtil.generateTokens.mockResolvedValue(mockTokens);

      await service.login(dtoWithSpaces);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { user_id: 'D001' },
        select: expect.any(Object),
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'User tidak ditemukan',
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if password does not match', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'NIM/NIP atau password tidak sesuai',
      );
      expect(userValidator.validateUser).not.toHaveBeenCalled();
    });

    it('should handle validateUser errors', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserValidator.validateUser.mockRejectedValue(
        new BadRequestException('Validation failed'),
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle token generation errors', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserValidator.validateUser.mockResolvedValue(mockPayload);
      mockJwtTokenUtil.generateTokens.mockRejectedValue(
        new Error('Token generation failed'),
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        'Token generation failed',
      );
    });

    it('should log tokens on successful login', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserValidator.validateUser.mockResolvedValue(mockPayload);
      mockJwtTokenUtil.generateTokens.mockResolvedValue(mockTokens);

      await service.login(loginDto);

      expect(console.log).toHaveBeenCalledWith(
        'access_token : ',
        'access.token.here',
      );
      expect(console.log).toHaveBeenCalledWith(
        'refresh_token : ',
        'refresh.token.here',
      );
    });

    // LINE 95: Test non-Error instance in catch block
    it('should handle non-Error exceptions in catch block', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue('String error');

      await expect(service.login(loginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Terjadi kesalahan pada server',
      );
    });

    it('should handle null errors in catch block', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle undefined errors in catch block', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue(undefined);

      await expect(service.login(loginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle numeric errors in catch block', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue(404);

      await expect(service.login(loginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle object errors without Error prototype', async () => {
      mockPrismaService.users.findUnique.mockRejectedValue({
        statusCode: 500,
        message: 'Something went wrong',
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should log error on failure', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();
      mockPrismaService.users.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.login(loginDto)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('logout', () => {
    const mockToken = 'valid.jwt.token';
    const mockUser = {
      user_id: 'D001',
      nama: 'John Doe',
      role: 'dosen',
    };

    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
    });

    it('should successfully logout with valid token', async () => {
      const result = await service.logout(mockToken, mockUser);

      expect(result).toEqual({
        success: true,
        message: 'Logout berhasil',
      });
      expect(console.log).toHaveBeenCalledWith(
        'User D001 melakukan logout',
      );
    });

    it('should handle logout without user info', async () => {
      const result = await service.logout(mockToken, null);

      expect(result).toEqual({
        success: true,
        message: 'Logout berhasil',
      });
      expect(console.log).toHaveBeenCalledWith(
        'User Unknown melakukan logout',
      );
    });

    it('should handle logout with undefined user', async () => {
      const result = await service.logout(mockToken, undefined);

      expect(result).toEqual({
        success: true,
        message: 'Logout berhasil',
      });
      expect(console.log).toHaveBeenCalledWith(
        'User Unknown melakukan logout',
      );
    });

    it('should throw UnauthorizedException if token is missing', async () => {
      await expect(service.logout('', mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.logout('', mockUser)).rejects.toThrow(
        'Token tidak ditemukan',
      );
    });

    it('should throw UnauthorizedException if token is null', async () => {
      await expect(service.logout(null as any, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is undefined', async () => {
      await expect(service.logout(undefined as any, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    // LINE 120: Test return in catch block after non-UnauthorizedException
    it('should return success on generic errors in catch block', async () => {
      // Mock console.log to throw an error
      jest.spyOn(console, 'log').mockImplementationOnce(() => {
        throw new Error('Console error');
      });

      const result = await service.logout(mockToken, mockUser);

      expect(result).toEqual({
        success: true,
        message: 'Logout berhasil',
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error saat logout:',
        expect.any(Error),
      );
    });

    it('should rethrow UnauthorizedException in catch block', async () => {
      // Mock console.log to throw UnauthorizedException
      jest.spyOn(console, 'log').mockImplementationOnce(() => {
        throw new UnauthorizedException('Unauthorized');
      });

      await expect(service.logout(mockToken, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle non-Error exceptions gracefully', async () => {
      jest.spyOn(console, 'log').mockImplementationOnce(() => {
        throw 'String error';
      });

      const result = await service.logout(mockToken, mockUser);

      expect(result).toEqual({
        success: true,
        message: 'Logout berhasil',
      });
    });

    it('should handle null exceptions gracefully', async () => {
      jest.spyOn(console, 'log').mockImplementationOnce(() => {
        throw null;
      });

      const result = await service.logout(mockToken, mockUser);

      expect(result).toEqual({
        success: true,
        message: 'Logout berhasil',
      });
    });

    it('should handle numeric exceptions gracefully', async () => {
      jest.spyOn(console, 'log').mockImplementationOnce(() => {
        throw 500;
      });

      const result = await service.logout(mockToken, mockUser);

      expect(result).toEqual({
        success: true,
        message: 'Logout berhasil',
      });
    });

    it('should log error details when error occurs', async () => {
      const error = new Error('Random error');
      jest.spyOn(console, 'log').mockImplementationOnce(() => {
        throw error;
      });

      await service.logout(mockToken, mockUser);

      expect(console.error).toHaveBeenCalledWith('Error saat logout:', error);
    });
  });
});