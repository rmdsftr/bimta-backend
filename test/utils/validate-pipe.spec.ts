import { BadRequestException } from '@nestjs/common';
import { ValidateIdPipe } from '../../src/utils/validate-pipe';

describe('ValidateIdPipe', () => {
  let pipe: ValidateIdPipe;

  beforeEach(() => {
    pipe = new ValidateIdPipe();
  });

  describe('Basic Functionality', () => {
    it('should be defined', () => {
      expect(pipe).toBeDefined();
    });

    it('should return trimmed valid ID', () => {
      const result = pipe.transform('123');
      expect(result).toBe('123');
    });

    it('should trim whitespace from ID', () => {
      const result = pipe.transform('  456  ');
      expect(result).toBe('456');
    });
  });

  describe('Valid IDs', () => {
    it('should accept numeric string', () => {
      expect(pipe.transform('12345')).toBe('12345');
    });

    it('should accept alphanumeric string', () => {
      expect(pipe.transform('abc123')).toBe('abc123');
    });

    it('should accept UUID format', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(pipe.transform(uuid)).toBe(uuid);
    });

    it('should accept string with hyphens', () => {
      expect(pipe.transform('user-123')).toBe('user-123');
    });

    it('should accept string with underscores', () => {
      expect(pipe.transform('user_123')).toBe('user_123');
    });

    it('should handle leading spaces', () => {
      expect(pipe.transform('   123')).toBe('123');
    });

    it('should handle trailing spaces', () => {
      expect(pipe.transform('123   ')).toBe('123');
    });

    it('should handle both leading and trailing spaces', () => {
      expect(pipe.transform('   123   ')).toBe('123');
    });
  });

  describe('Invalid IDs - Should Throw BadRequestException', () => {
    it('should throw BadRequestException for empty string', () => {
      expect(() => pipe.transform('')).toThrow(BadRequestException);
      expect(() => pipe.transform('')).toThrow('ID tidak valid');
    });

    it('should throw BadRequestException for whitespace only', () => {
      expect(() => pipe.transform('   ')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for null value', () => {
      expect(() => pipe.transform(null as any)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for undefined value', () => {
      expect(() => pipe.transform(undefined as any)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for tabs only', () => {
      expect(() => pipe.transform('\t\t\t')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for newlines only', () => {
      expect(() => pipe.transform('\n\n\n')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for mixed whitespace only', () => {
      expect(() => pipe.transform('  \t\n  ')).toThrow(BadRequestException);
    });
  });

  describe('Type Validation', () => {
    it('should throw BadRequestException for number type', () => {
      expect(() => pipe.transform(123 as any)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for boolean type', () => {
      expect(() => pipe.transform(true as any)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for object type', () => {
      expect(() => pipe.transform({} as any)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for array type', () => {
      expect(() => pipe.transform([] as any)).toThrow(BadRequestException);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long IDs', () => {
      const longId = 'a'.repeat(1000);
      expect(pipe.transform(longId)).toBe(longId);
    });

    it('should handle single character ID', () => {
      expect(pipe.transform('a')).toBe('a');
      expect(pipe.transform('1')).toBe('1');
    });

    it('should handle special characters', () => {
      expect(pipe.transform('id@123')).toBe('id@123');
      expect(pipe.transform('id#456')).toBe('id#456');
      expect(pipe.transform('id$789')).toBe('id$789');
    });

    it('should handle IDs with dots', () => {
      expect(pipe.transform('user.123')).toBe('user.123');
    });

    it('should handle IDs with slashes', () => {
      expect(pipe.transform('user/123')).toBe('user/123');
    });

    it('should handle mixed case IDs', () => {
      expect(pipe.transform('AbC123')).toBe('AbC123');
    });
  });

  describe('Real-world Use Cases', () => {
    it('should handle MongoDB ObjectId format', () => {
      const objectId = '507f1f77bcf86cd799439011';
      expect(pipe.transform(objectId)).toBe(objectId);
    });

    it('should handle PostgreSQL bigint', () => {
      const bigint = '9223372036854775807';
      expect(pipe.transform(bigint)).toBe(bigint);
    });

    it('should handle route parameters with extra spaces', () => {
      expect(pipe.transform(' 123 ')).toBe('123');
    });

    it('should handle query parameters', () => {
      expect(pipe.transform('user123')).toBe('user123');
    });
  });

  describe('Error Message', () => {
    it('should throw error with correct message', () => {
      try {
        pipe.transform('');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('ID tidak valid');
      }
    });

    it('should throw BadRequestException instance', () => {
      expect(() => pipe.transform('')).toThrow(BadRequestException);
    });
  });

  describe('Transform Method', () => {
    it('should implement PipeTransform interface', () => {
      expect(typeof pipe.transform).toBe('function');
    });

    it('should return string type', () => {
      const result = pipe.transform('123');
      expect(typeof result).toBe('string');
    });

    it('should not modify valid input unnecessarily', () => {
      const input = 'validId123';
      const result = pipe.transform(input);
      expect(result).toBe(input);
    });
  });

  describe('Security', () => {
    it('should handle potential XSS attempts', () => {
      const xss = '<script>alert("xss")</script>';
      expect(pipe.transform(xss)).toBe(xss);
    });

    it('should handle SQL injection attempts', () => {
      const sql = "1' OR '1'='1";
      expect(pipe.transform(sql)).toBe(sql);
    });

    it('should handle path traversal attempts', () => {
      const path = '../../../etc/passwd';
      expect(pipe.transform(path)).toBe(path);
    });
  });

  describe('Performance', () => {
    it('should handle multiple validations efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        pipe.transform(`id-${i}`);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); 
    });

    it('should be fast for simple IDs', () => {
      const startTime = Date.now();
      pipe.transform('123');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10); 
    });
  });

  describe('Immutability', () => {
    it('should not modify the original input object context', () => {
      const input = '  test  ';
      const result = pipe.transform(input);
      
      expect(input).toBe('  test  '); 
      expect(result).toBe('test'); 
    });
  });
});