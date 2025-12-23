import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { AuthController } from '../../src/auth/auth.controller';
import { RegisterDto } from '../../src/auth/dto/register.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';

describe('AuthController - Complete Coverage', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto: RegisterDto = {
        user_id: '123',
        nama: 'Talitha',
        no_whatsapp: '089999',
        role: 'admin',
      };

      const mockResult = {
        user_id: '123',
        nama: 'Talitha',
        no_whatsapp: '089999',
        sandi: '123456',
        status_user: 'active',
        role: 'admin',
      };

      mockAuthService.register.mockResolvedValue(mockResult);
      const result = await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('login', () => {
    it('should return login success with tokens', async () => {
      const dto: LoginDto = {
        user_id: '123',
        sandi: 'password',
      };

      const mockResult = {
        message: 'Login berhasil',
        data: {
          user_id: '123',
          nama: 'Talitha',
          role: 'admin',
          access_token: 'token123',
          refresh_token: 'ref123',
        },
      };

      mockAuthService.login.mockResolvedValue(mockResult);
      const result = await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });

    // TEST UNTUK COVER console.log di line 23
    it('should log received data', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const dto: LoginDto = {
        user_id: '123',
        sandi: 'password',
      };

      mockAuthService.login.mockResolvedValue({});
      await controller.login(dto);

      expect(consoleSpy).toHaveBeenCalledWith('data yang didapat : ', dto);
      consoleSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should logout successfully with Bearer token', async () => {
      const mockRequest: any = {
        headers: {
          authorization: 'Bearer testtoken',
        },
        user: { user_id: '123' },
      };

      const mockResult = {
        success: true,
        message: 'Logout berhasil',
      };

      mockAuthService.logout.mockResolvedValue(mockResult);
      const result = await controller.logout(mockRequest);

      expect(service.logout).toHaveBeenCalledWith('testtoken', mockRequest.user);
      expect(result).toEqual(mockResult);
    });

    // TEST UNTUK COVER line 28 - ketika tidak ada authorization header
    it('should handle logout without authorization header', async () => {
      const mockRequest: any = {
        headers: {},
        user: { user_id: '123' },
      };

      const mockResult = {
        success: true,
        message: 'Logout berhasil',
      };

      mockAuthService.logout.mockResolvedValue(mockResult);
      const result = await controller.logout(mockRequest);

      expect(service.logout).toHaveBeenCalledWith('', mockRequest.user);
      expect(result).toEqual(mockResult);
    });
  });
});