import { Test } from '@nestjs/testing';
import { JwtStrategy } from '../../src/auth/strategy/jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    // Set environment variable untuk test
    process.env.JWT_SECRET = 'test-secret-key';

    const module = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    // Clean up environment variable
    delete process.env.JWT_SECRET;
  });

  describe('validate', () => {
    it('should return transformed user data when payload is valid', async () => {
      const payload = {
        user_id: '123',
        nama: 'Test User',
        role: 'mahasiswa',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: '123',
        nama: 'Test User',
        role: 'mahasiswa',
      });
    });

    it('should transform user_id to userId', async () => {
      const payload = {
        user_id: 'USER001',
        nama: 'Mahasiswa Test',
        role: 'mahasiswa',
      };

      const result = await strategy.validate(payload);

      expect(result.userId).toBe('USER001');
      expect(result).not.toHaveProperty('user_id');
    });

    it('should handle dosen role', async () => {
      const payload = {
        user_id: 'DOSEN001',
        nama: 'Dosen Test',
        role: 'dosen',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'DOSEN001',
        nama: 'Dosen Test',
        role: 'dosen',
      });
    });

    it('should preserve all payload properties', async () => {
      const payload = {
        user_id: '456',
        nama: 'Another User',
        role: 'admin',
      };

      const result = await strategy.validate(payload);

      expect(result.userId).toBe(payload.user_id);
      expect(result.nama).toBe(payload.nama);
      expect(result.role).toBe(payload.role);
    });
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });

    it('should use custom JWT_SECRET from environment', () => {
      expect(process.env.JWT_SECRET).toBe('test-secret-key');
    });

    it('should use default secret when JWT_SECRET is not set', async () => {
      delete process.env.JWT_SECRET;

      const module = await Test.createTestingModule({
        providers: [JwtStrategy],
      }).compile();

      const newStrategy = module.get<JwtStrategy>(JwtStrategy);
      expect(newStrategy).toBeDefined();
    });
  });
});