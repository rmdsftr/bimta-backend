import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtTokenUtil, TokenPair } from '../../src/utils/jwt_token';
import { jwtPayload } from '../../src/auth/interfaces/payload';

describe('JwtTokenUtil', () => {
  let jwtTokenUtil: JwtTokenUtil;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockPayload: jwtPayload = {
    user_id: '123',
    nama: 'test@example.com',
    role: 'user',
  };

  const mockAccessToken = 'mock.access.token';
  const mockRefreshToken = 'mock.refresh.token';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtTokenUtil,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'jwt.secret': 'test-secret',
                'jwt.accessTokenExpiry': '15m',
                'jwt.refreshTokenExpiry': '7d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    jwtTokenUtil = module.get<JwtTokenUtil>(JwtTokenUtil);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(jwtTokenUtil).toBeDefined();
  });

  describe('Constructor', () => {
    it('should load configuration from ConfigService', () => {
      expect(configService.get).toHaveBeenCalledWith('jwt.secret');
      expect(configService.get).toHaveBeenCalledWith('jwt.accessTokenExpiry');
      expect(configService.get).toHaveBeenCalledWith('jwt.refreshTokenExpiry');
    });

    it('should use fallback values when config is not available', async () => {
      const moduleWithoutConfig = await Test.createTestingModule({
        providers: [
          JwtTokenUtil,
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn(),
              verify: jest.fn(),
            },
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
        ],
      }).compile();

      const util = moduleWithoutConfig.get<JwtTokenUtil>(JwtTokenUtil);
      expect(util).toBeDefined();
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', async () => {
      (jwtService.sign as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const result: TokenPair = await jwtTokenUtil.generateTokens(mockPayload);

      expect(result).toHaveProperty('access_token', mockAccessToken);
      expect(result).toHaveProperty('refresh_token', mockRefreshToken);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should call generateAccessToken and generateRefreshToken', async () => {
      (jwtService.sign as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      await jwtTokenUtil.generateTokens(mockPayload);

      expect(jwtService.sign).toHaveBeenNthCalledWith(1, mockPayload, {
        secret: 'test-secret',
        expiresIn: '15m',
        issuer: 'bimta',
      });

      expect(jwtService.sign).toHaveBeenNthCalledWith(2, mockPayload, {
        secret: 'test-secret',
        expiresIn: '7d',
        issuer: 'bimta',
      });
    });

    it('should generate tokens in parallel using Promise.all', async () => {
      (jwtService.sign as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const startTime = Date.now();
      await jwtTokenUtil.generateTokens(mockPayload);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should handle different payload types', async () => {
      const customPayload: jwtPayload = {
        user_id: '456',
        nama: 'admin@example.com',
        role: 'admin',
      };

      (jwtService.sign as jest.Mock)
        .mockResolvedValueOnce('token1')
        .mockResolvedValueOnce('token2');

      const result = await jwtTokenUtil.generateTokens(customPayload);

      expect(result.access_token).toBe('token1');
      expect(result.refresh_token).toBe('token2');
      expect(jwtService.sign).toHaveBeenCalledWith(customPayload, expect.any(Object));
    });
  });

  describe('generateAccessToken (private)', () => {
    it('should generate access token with correct options', async () => {
      (jwtService.sign as jest.Mock).mockResolvedValue(mockAccessToken);

      await jwtTokenUtil.generateTokens(mockPayload);

      expect(jwtService.sign).toHaveBeenCalledWith(mockPayload, {
        secret: 'test-secret',
        expiresIn: '15m',
        issuer: 'bimta',
      });
    });

    it('should use configured access token expiry', async () => {
      (jwtService.sign as jest.Mock).mockResolvedValue(mockAccessToken);

      await jwtTokenUtil.generateTokens(mockPayload);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          expiresIn: '15m',
        })
      );
    });

    it('should include issuer in token options', async () => {
      (jwtService.sign as jest.Mock).mockResolvedValue(mockAccessToken);

      await jwtTokenUtil.generateTokens(mockPayload);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          issuer: 'bimta',
        })
      );
    });
  });

  describe('generateRefreshToken (private)', () => {
    it('should generate refresh token with correct options', async () => {
      (jwtService.sign as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      await jwtTokenUtil.generateTokens(mockPayload);

      expect(jwtService.sign).toHaveBeenCalledWith(mockPayload, {
        secret: 'test-secret',
        expiresIn: '7d',
        issuer: 'bimta',
      });
    });

    it('should use longer expiry time than access token', async () => {
      (jwtService.sign as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      await jwtTokenUtil.generateTokens(mockPayload);

      const calls = (jwtService.sign as jest.Mock).mock.calls;
      const accessExpiry = calls[0][1].expiresIn;
      const refreshExpiry = calls[1][1].expiresIn;

      expect(accessExpiry).toBe('15m');
      expect(refreshExpiry).toBe('7d');
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', () => {
      const mockVerifiedPayload: jwtPayload = {
        user_id: '123',
        nama: 'test@example.com',
        role: 'user',
      };

      (jwtService.verify as jest.Mock).mockReturnValue(mockVerifiedPayload);

      const result = jwtTokenUtil.verifyToken(mockAccessToken);

      expect(jwtService.verify).toHaveBeenCalledWith(mockAccessToken, {
        secret: 'test-secret',
        issuer: 'bimta',
      });
      expect(result).toEqual(mockVerifiedPayload);
    });

    it('should use configured secret for verification', () => {
      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);

      jwtTokenUtil.verifyToken('some.token');

      expect(jwtService.verify).toHaveBeenCalledWith(
        'some.token',
        expect.objectContaining({
          secret: 'test-secret',
        })
      );
    });

    it('should verify issuer in token', () => {
      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);

      jwtTokenUtil.verifyToken('some.token');

      expect(jwtService.verify).toHaveBeenCalledWith(
        'some.token',
        expect.objectContaining({
          issuer: 'bimta',
        })
      );
    });

    it('should throw error for invalid token', () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => jwtTokenUtil.verifyToken('invalid.token')).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      expect(() => jwtTokenUtil.verifyToken(mockAccessToken)).toThrow('Token expired');
    });

    it('should throw error for malformed token', () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        const error: any = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      expect(() => jwtTokenUtil.verifyToken('malformed')).toThrow('jwt malformed');
    });

    it('should return correct payload structure', () => {
      const expectedPayload = {
        id: '789',
        email: 'user@test.com',
        role: 'moderator',
      };

      (jwtService.verify as jest.Mock).mockReturnValue(expectedPayload);

      const result = jwtTokenUtil.verifyToken('token');

      expect(result).toBeDefined();
      expect(result).toEqual(expectedPayload);
    });
  });

  describe('Token Lifecycle Integration', () => {
    it('should generate and verify tokens successfully', async () => {
      const testPayload: jwtPayload = {
        user_id: '999',
        nama: 'lifecycle@test.com',
        role: 'user',
      };

      (jwtService.sign as jest.Mock)
        .mockResolvedValueOnce('access.token')
        .mockResolvedValueOnce('refresh.token');
      (jwtService.verify as jest.Mock).mockReturnValue(testPayload);

      const tokens = await jwtTokenUtil.generateTokens(testPayload);

      expect(tokens.access_token).toBe('access.token');
      expect(tokens.refresh_token).toBe('refresh.token');

      const verified = jwtTokenUtil.verifyToken(tokens.access_token);
      expect(verified).toEqual(testPayload);
    });

    it('should use same secret for signing and verification', async () => {
      (jwtService.sign as jest.Mock).mockResolvedValue('token');
      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);

      await jwtTokenUtil.generateTokens(mockPayload);
      jwtTokenUtil.verifyToken('token');

      const signCall = (jwtService.sign as jest.Mock).mock.calls[0][1];
      const verifyCall = (jwtService.verify as jest.Mock).mock.calls[0][1];

      expect(signCall.secret).toBe(verifyCall.secret);
    });

    it('should use same issuer for signing and verification', async () => {
      (jwtService.sign as jest.Mock).mockResolvedValue('token');
      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);

      await jwtTokenUtil.generateTokens(mockPayload);
      jwtTokenUtil.verifyToken('token');

      const signCall = (jwtService.sign as jest.Mock).mock.calls[0][1];
      const verifyCall = (jwtService.verify as jest.Mock).mock.calls[0][1];

      expect(signCall.issuer).toBe('bimta');
      expect(verifyCall.issuer).toBe('bimta');
    });
  });

  describe('Error Handling', () => {
    it('should handle JwtService.sign errors', async () => {
      (jwtService.sign as jest.Mock).mockRejectedValue(new Error('Signing failed'));

      await expect(jwtTokenUtil.generateTokens(mockPayload)).rejects.toThrow('Signing failed');
    });

    it('should handle JwtService.verify errors', () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Verification failed');
      });

      expect(() => jwtTokenUtil.verifyToken('token')).toThrow('Verification failed');
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should use fallback secret when not configured', async () => {
      const moduleWithFallback = await Test.createTestingModule({
        providers: [
          JwtTokenUtil,
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn().mockResolvedValue('token'),
              verify: jest.fn(),
            },
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'jwt.secret') return undefined;
                if (key === 'jwt.accessTokenExpiry') return '15m';
                if (key === 'jwt.refreshTokenExpiry') return '7d';
              }),
            },
          },
        ],
      }).compile();

      const util = moduleWithFallback.get<JwtTokenUtil>(JwtTokenUtil);
      await util.generateTokens(mockPayload);

      const jwtSvc = moduleWithFallback.get<JwtService>(JwtService);
      expect(jwtSvc.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          secret: 'fallback-secret',
        })
      );
    });
  });
});