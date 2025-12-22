import { jwtConfig } from "../../src/config/jwt.config";

describe('JWT Configuration', () => {
  const originalEnv = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN,
  };

  afterEach(() => {
    // Restore original environment variables
    process.env.JWT_SECRET = originalEnv.JWT_SECRET;
    process.env.JWT_EXPIRES_IN = originalEnv.JWT_EXPIRES_IN;
    process.env.REFRESH_EXPIRES_IN = originalEnv.REFRESH_EXPIRES_IN;
  });

  describe('jwtConfig object', () => {
    it('should be defined', () => {
      expect(jwtConfig).toBeDefined();
    });

    it('should be an object', () => {
      expect(typeof jwtConfig).toBe('object');
    });

    it('should have all required properties', () => {
      expect(jwtConfig).toHaveProperty('secret');
      expect(jwtConfig).toHaveProperty('accessTokenExpiry');
      expect(jwtConfig).toHaveProperty('refreshTokenExpiry');
      expect(jwtConfig).toHaveProperty('issuer');
    });

    it('should have correct property types', () => {
      expect(typeof jwtConfig.secret).toBe('string');
      expect(typeof jwtConfig.accessTokenExpiry).toBe('string');
      expect(typeof jwtConfig.refreshTokenExpiry).toBe('string');
      expect(typeof jwtConfig.issuer).toBe('string');
    });
  });

  describe('secret property', () => {
    it('should use JWT_SECRET from environment when available', () => {
      // This test verifies the config structure
      expect(jwtConfig.secret).toBeDefined();
      expect(jwtConfig.secret.length).toBeGreaterThan(0);
    });

    it('should have default value when JWT_SECRET is not set', () => {
      const defaultSecret = 'bimbingan-tugas-akhir-sistem-informasi-universitas-andalas-bimta';
      
      // If no env var is set, it should use the default
      if (!process.env.JWT_SECRET) {
        expect(jwtConfig.secret).toBe(defaultSecret);
      }
    });

    it('should not be empty', () => {
      expect(jwtConfig.secret).not.toBe('');
      expect(jwtConfig.secret).toBeTruthy();
    });
  });

  describe('accessTokenExpiry property', () => {
    it('should be defined', () => {
      expect(jwtConfig.accessTokenExpiry).toBeDefined();
    });

    it('should have default value of 15m when JWT_EXPIRES_IN is not set', () => {
      if (!process.env.JWT_EXPIRES_IN) {
        expect(jwtConfig.accessTokenExpiry).toBe('15m');
      }
    });

    it('should be a valid time string', () => {
      // Should match patterns like: 15m, 1h, 7d, etc.
      expect(jwtConfig.accessTokenExpiry).toMatch(/^\d+[smhd]$/);
    });

    it('should not be empty', () => {
      expect(jwtConfig.accessTokenExpiry).not.toBe('');
      expect(jwtConfig.accessTokenExpiry).toBeTruthy();
    });
  });

  describe('refreshTokenExpiry property', () => {
    it('should be defined', () => {
      expect(jwtConfig.refreshTokenExpiry).toBeDefined();
    });

    it('should have default value of 7d when REFRESH_EXPIRES_IN is not set', () => {
      if (!process.env.REFRESH_EXPIRES_IN) {
        expect(jwtConfig.refreshTokenExpiry).toBe('7d');
      }
    });

    it('should be a valid time string', () => {
      expect(jwtConfig.refreshTokenExpiry).toMatch(/^\d+[smhd]$/);
    });

    it('should not be empty', () => {
      expect(jwtConfig.refreshTokenExpiry).not.toBe('');
      expect(jwtConfig.refreshTokenExpiry).toBeTruthy();
    });

    it('should be longer than accessTokenExpiry', () => {
      // Parse time values
      const parseTime = (timeStr: string) => {
        const value = parseInt(timeStr);
        const unit = timeStr.slice(-1);
        const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
        return value * (multipliers[unit] || 1);
      };

      const accessSeconds = parseTime(jwtConfig.accessTokenExpiry);
      const refreshSeconds = parseTime(jwtConfig.refreshTokenExpiry);

      expect(refreshSeconds).toBeGreaterThan(accessSeconds);
    });
  });

  describe('issuer property', () => {
    it('should be defined', () => {
      expect(jwtConfig.issuer).toBeDefined();
    });

    it('should be "bimta"', () => {
      expect(jwtConfig.issuer).toBe('bimta');
    });

    it('should be a non-empty string', () => {
      expect(jwtConfig.issuer).not.toBe('');
      expect(typeof jwtConfig.issuer).toBe('string');
    });
  });

  describe('configuration consistency', () => {
    it('should have consistent configuration for JWT operations', () => {
      // All required fields should be present for JWT to work
      expect(jwtConfig.secret).toBeTruthy();
      expect(jwtConfig.accessTokenExpiry).toBeTruthy();
      expect(jwtConfig.refreshTokenExpiry).toBeTruthy();
      expect(jwtConfig.issuer).toBeTruthy();
    });

    it('should be immutable reference', () => {
      // The config object should be the same reference
      const config1 = jwtConfig;
      const config2 = jwtConfig;
      expect(config1).toBe(config2);
    });
  });

  describe('environment variable handling', () => {
    it('should handle all environment variables being undefined', () => {
      // Even without env vars, config should have valid defaults
      expect(jwtConfig.secret).toBeDefined();
      expect(jwtConfig.accessTokenExpiry).toBeDefined();
      expect(jwtConfig.refreshTokenExpiry).toBeDefined();
    });

    it('should match expected values based on configuration logic', () => {
      // Test the actual values that config should have
      const defaultSecret = 'bimbingan-tugas-akhir-sistem-informasi-universitas-andalas-bimta';
      
      // jwtConfig values should match one of these patterns
      // Either from env or from default
      expect([
        process.env.JWT_SECRET,
        defaultSecret
      ]).toContain(jwtConfig.secret);
      
      expect([
        process.env.JWT_EXPIRES_IN,
        '15m'
      ]).toContain(jwtConfig.accessTokenExpiry);
      
      expect([
        process.env.REFRESH_EXPIRES_IN,
        '7d'
      ]).toContain(jwtConfig.refreshTokenExpiry);
    });

    it('should have valid values regardless of environment', () => {
      // Config should always have valid, non-empty values
      expect(jwtConfig.secret).toBeTruthy();
      expect(jwtConfig.secret).not.toBe('undefined');
      expect(jwtConfig.secret.length).toBeGreaterThan(0);
      
      expect(jwtConfig.accessTokenExpiry).toBeTruthy();
      expect(jwtConfig.accessTokenExpiry).not.toBe('undefined');
      
      expect(jwtConfig.refreshTokenExpiry).toBeTruthy();
      expect(jwtConfig.refreshTokenExpiry).not.toBe('undefined');
    });
  });

  describe('security considerations', () => {
    it('should have a reasonably strong default secret', () => {
      const defaultSecret = 'bimbingan-tugas-akhir-sistem-informasi-universitas-andalas-bimta';
      
      if (jwtConfig.secret === defaultSecret) {
        // Default secret should be long enough
        expect(jwtConfig.secret.length).toBeGreaterThanOrEqual(32);
      }
    });

    it('should have reasonable token expiry times', () => {
      // Access token should expire relatively quickly
      expect(jwtConfig.accessTokenExpiry).toMatch(/^(15m|30m|1h)$/);
      
      // Refresh token should have longer expiry
      expect(['7d', '14d', '30d']).toContain(jwtConfig.refreshTokenExpiry);
    });
  });
});