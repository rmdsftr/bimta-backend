import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtTokenUtil } from '../../src/utils/jwt_token';
import { UserValidator } from '../../src/validators/user.validator';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtMock = {
    generateTokens: jest.fn(),
  };

  const userValidatorMock = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtTokenUtil, useValue: jwtMock },
        { provide: UserValidator, useValue: userValidatorMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------
  // REGISTER
  // ------------------------------------------------------------

  it('should throw error if user already exists on register', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ user_id: '123' });

    await expect(
      service.register({
        user_id: '123',
        nama: 'AAA',
        no_whatsapp: '08',
        role: 'student',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should register user successfully', async () => {
    prismaMock.users.findUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpw');

    prismaMock.users.create.mockResolvedValue({
      user_id: '123',
      nama: 'Aaa',
      no_whatsapp: '08',
      sandi: 'hashedpw',
      role: 'student',
    });

    const result = await service.register({
      user_id: '123',
      nama: 'aaa',
      no_whatsapp: '08',
      role: 'student',
    } as any);

    expect(prismaMock.users.create).toHaveBeenCalled();
    expect(result.user_id).toBe('123');
  });

  // ------------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------------

  it('should throw error if user not found on login', async () => {
    prismaMock.users.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ user_id: 'notfound', sandi: '123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw error if password invalid', async () => {
    prismaMock.users.findUnique.mockResolvedValue({
      user_id: '123',
      sandi: 'hashed',
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ user_id: '123', sandi: 'wrong' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should login successfully', async () => {
    prismaMock.users.findUnique.mockResolvedValue({
      user_id: '123',
      sandi: 'hashedpassword',
      nama: 'User',
      role: 'student',
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    userValidatorMock.validateUser.mockResolvedValue({
      user_id: '123',
      role: 'student',
    });
    jwtMock.generateTokens.mockResolvedValue({
      access_token: 'access123',
      refresh_token: 'refresh123',
    });

    const result = await service.login({ user_id: '123', sandi: 'correct' });

    expect(result.data.access_token).toBe('access123');
    expect(userValidatorMock.validateUser).toHaveBeenCalledWith('123');
  });

  // ------------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------------

  it('should throw unauthorized if token missing', async () => {
    await expect(service.logout('', { user_id: '123' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should logout successfully', async () => {
    const result = await service.logout('token123', { user_id: '123' });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Logout berhasil');
  });
});
