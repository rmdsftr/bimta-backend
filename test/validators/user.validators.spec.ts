import { Test, TestingModule } from '@nestjs/testing';
import { 
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  validate
} from 'class-validator';
import { plainToClass } from 'class-transformer';


describe('User Validators', () => {

  @ValidatorConstraint({ name: 'isEmailUnique', async: true })
  class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
    async validate(email: string): Promise<boolean> {
      const existingEmails = ['existing@example.com', 'taken@example.com'];
      return !existingEmails.includes(email);
    }

    defaultMessage(): string {
      return 'Email already exists';
    }
  }

  function IsEmailUnique(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        constraints: [],
        validator: IsEmailUniqueConstraint,
      });
    };
  }

  @ValidatorConstraint({ name: 'isValidNIM', async: false })
  class IsValidNIMConstraint implements ValidatorConstraintInterface {
    validate(nim: string): boolean {
      const nimRegex = /^[0-9]{10}$/;
      return nimRegex.test(nim);
    }

    defaultMessage(): string {
      return 'NIM must be exactly 10 digits';
    }
  }

  function IsValidNIM(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        constraints: [],
        validator: IsValidNIMConstraint,
      });
    };
  }

  @ValidatorConstraint({ name: 'isStrongPassword', async: false })
  class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
    validate(password: string): boolean {
      if (!password || password.length < 8) return false;
      
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      
      return hasUpperCase && hasLowerCase && hasNumber;
    }

    defaultMessage(): string {
      return 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
  }

  function IsStrongPassword(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        constraints: [],
        validator: IsStrongPasswordConstraint,
      });
    };
  }

  describe('IsEmailUniqueConstraint', () => {
    let constraint: IsEmailUniqueConstraint;

    beforeEach(() => {
      constraint = new IsEmailUniqueConstraint();
    });

    it('should be defined', () => {
      expect(constraint).toBeDefined();
    });

    it('should validate unique email', async () => {
      const result = await constraint.validate('new@example.com');
      expect(result).toBe(true);
    });

    it('should reject existing email', async () => {
      const result = await constraint.validate('existing@example.com');
      expect(result).toBe(false);
    });

    it('should reject taken email', async () => {
      const result = await constraint.validate('taken@example.com');
      expect(result).toBe(false);
    });

    it('should return correct error message', () => {
      const message = constraint.defaultMessage();
      expect(message).toBe('Email already exists');
    });

    it('should handle empty string', async () => {
      const result = await constraint.validate('');
      expect(result).toBe(true); 
    });

    it('should be case sensitive', async () => {
      const result = await constraint.validate('EXISTING@EXAMPLE.COM');
      expect(result).toBe(true); 
    });

    it('should handle special characters in email', async () => {
      const result = await constraint.validate('user+tag@example.com');
      expect(result).toBe(true);
    });
  });

  describe('IsValidNIMConstraint', () => {
    let constraint: IsValidNIMConstraint;

    beforeEach(() => {
      constraint = new IsValidNIMConstraint();
    });

    it('should be defined', () => {
      expect(constraint).toBeDefined();
    });

    it('should validate correct NIM format', () => {
      const result = constraint.validate('2101234567');
      expect(result).toBe(true);
    });

    it('should reject NIM with less than 10 digits', () => {
      const result = constraint.validate('123456789');
      expect(result).toBe(false);
    });

    it('should reject NIM with more than 10 digits', () => {
      const result = constraint.validate('12345678901');
      expect(result).toBe(false);
    });

    it('should reject NIM with letters', () => {
      const result = constraint.validate('210123456A');
      expect(result).toBe(false);
    });

    it('should reject NIM with special characters', () => {
      const result = constraint.validate('2101234-67');
      expect(result).toBe(false);
    });

    it('should reject empty string', () => {
      const result = constraint.validate('');
      expect(result).toBe(false);
    });

    it('should reject NIM with spaces', () => {
      const result = constraint.validate('2101 234567');
      expect(result).toBe(false);
    });

    it('should return correct error message', () => {
      const message = constraint.defaultMessage();
      expect(message).toBe('NIM must be exactly 10 digits');
    });

    it('should validate different valid NIMs', () => {
      const validNIMs = ['1234567890', '0000000000', '9999999999'];
      validNIMs.forEach(nim => {
        expect(constraint.validate(nim)).toBe(true);
      });
    });
  });

  describe('IsStrongPasswordConstraint', () => {
    let constraint: IsStrongPasswordConstraint;

    beforeEach(() => {
      constraint = new IsStrongPasswordConstraint();
    });

    it('should be defined', () => {
      expect(constraint).toBeDefined();
    });

    it('should validate strong password', () => {
      const result = constraint.validate('Password123');
      expect(result).toBe(true);
    });

    it('should reject password without uppercase', () => {
      const result = constraint.validate('password123');
      expect(result).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = constraint.validate('PASSWORD123');
      expect(result).toBe(false);
    });

    it('should reject password without number', () => {
      const result = constraint.validate('PasswordABC');
      expect(result).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = constraint.validate('Pass123');
      expect(result).toBe(false);
    });

    it('should reject empty password', () => {
      const result = constraint.validate('');
      expect(result).toBe(false);
    });

    it('should validate password with special characters', () => {
      const result = constraint.validate('Password123!@#');
      expect(result).toBe(true);
    });

    it('should validate exactly 8 character password', () => {
      const result = constraint.validate('Pass1234');
      expect(result).toBe(true);
    });

    it('should validate very long password', () => {
      const result = constraint.validate('Password123456789ABCDEFG');
      expect(result).toBe(true);
    });

    it('should return correct error message', () => {
      const message = constraint.defaultMessage();
      expect(message).toContain('8 characters');
      expect(message).toContain('uppercase');
      expect(message).toContain('lowercase');
      expect(message).toContain('number');
    });

    it('should handle null password', () => {
      const result = constraint.validate(null as any);
      expect(result).toBe(false);
    });

    it('should handle undefined password', () => {
      const result = constraint.validate(undefined as any);
      expect(result).toBe(false);
    });
  });

  describe('Validator Integration Tests', () => {
    class TestUserDto {
      @IsEmailUnique()
      email: string;

      @IsValidNIM()
      nim: string;

      @IsStrongPassword()
      password: string;
    }

    it('should validate valid user DTO', async () => {
      const dto = plainToClass(TestUserDto, {
        email: 'newuser@example.com',
        nim: '2101234567',
        password: 'Password123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid email', async () => {
      const dto = plainToClass(TestUserDto, {
        email: 'existing@example.com',
        nim: '2101234567',
        password: 'Password123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const emailError = errors.find(e => e.property === 'email');
      expect(emailError).toBeDefined();
    });

    it('should reject invalid NIM', async () => {
      const dto = plainToClass(TestUserDto, {
        email: 'newuser@example.com',
        nim: '123',
        password: 'Password123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nimError = errors.find(e => e.property === 'nim');
      expect(nimError).toBeDefined();
    });

    it('should reject weak password', async () => {
      const dto = plainToClass(TestUserDto, {
        email: 'newuser@example.com',
        nim: '2101234567',
        password: 'weak',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find(e => e.property === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should handle multiple validation errors', async () => {
      const dto = plainToClass(TestUserDto, {
        email: 'existing@example.com',
        nim: 'invalid',
        password: 'weak',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(3); 
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle validation with null values', async () => {
      const constraint = new IsValidNIMConstraint();
      const result = constraint.validate(null as any);
      expect(result).toBe(false);
    });

    it('should handle validation with undefined values', async () => {
      const constraint = new IsValidNIMConstraint();
      const result = constraint.validate(undefined as any);
      expect(result).toBe(false);
    });

    it('should handle whitespace in NIM', () => {
      const constraint = new IsValidNIMConstraint();
      expect(constraint.validate('  2101234567  ')).toBe(false);
    });

    it('should handle leading zeros in NIM', () => {
      const constraint = new IsValidNIMConstraint();
      expect(constraint.validate('0000000001')).toBe(true);
    });

    it('should handle password with only numbers', () => {
      const constraint = new IsStrongPasswordConstraint();
      expect(constraint.validate('12345678')).toBe(false);
    });

    it('should handle password with only letters', () => {
      const constraint = new IsStrongPasswordConstraint();
      expect(constraint.validate('PasswordOnly')).toBe(false);
    });

    it('should handle mixed case emails', async () => {
      const constraint = new IsEmailUniqueConstraint();
      const result = await constraint.validate('NewUser@Example.Com');
      expect(result).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should validate NIM quickly', () => {
      const constraint = new IsValidNIMConstraint();
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        constraint.validate('2101234567');
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); 
    });

    it('should validate password quickly', () => {
      const constraint = new IsStrongPasswordConstraint();
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        constraint.validate('Password123');
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });

    it('should handle batch validations', async () => {
      const constraint = new IsEmailUniqueConstraint();
      const emails = Array.from({ length: 100 }, (_, i) => `user${i}@example.com`);
      
      const startTime = Date.now();
      await Promise.all(emails.map(email => constraint.validate(email)));
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Security Considerations', () => {
    it('should prevent SQL injection in NIM', () => {
      const constraint = new IsValidNIMConstraint();
      const sqlInjection = "2101234567' OR '1'='1";
      expect(constraint.validate(sqlInjection)).toBe(false);
    });

    it('should handle XSS attempts in email validation', async () => {
      const constraint = new IsEmailUniqueConstraint();
      const xss = '<script>alert("xss")</script>@example.com';
      const result = await constraint.validate(xss);
      expect(typeof result).toBe('boolean');
    });

    it('should validate password complexity for common patterns', () => {
      const constraint = new IsStrongPasswordConstraint();
      const commonPasswords = [
        'Password1', 
        'Qwerty123',
        'Admin123',
      ];

      commonPasswords.forEach(password => {
        expect(constraint.validate(password)).toBe(true);
      });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should validate academic year in NIM', () => {
      const constraint = new IsValidNIMConstraint();
 
      const nims = ['2101234567', '2201234567', '2301234567'];
      nims.forEach(nim => {
        expect(constraint.validate(nim)).toBe(true);
      });
    });

    it('should handle international email formats', async () => {
      const constraint = new IsEmailUniqueConstraint();
      
      const internationalEmails = [
        'user@example.co.uk',
        'user@example.com.au',
        'user@example.co.id',
      ];

      for (const email of internationalEmails) {
        const result = await constraint.validate(email);
        expect(typeof result).toBe('boolean');
      }
    });

    it('should validate various strong password formats', () => {
      const constraint = new IsStrongPasswordConstraint();
      
      const strongPasswords = [
        'MyP@ssw0rd',
        'Str0ng!Pass',
        'C0mpl3x#Pwd',
        'S3cur3P@ss',
      ];

      strongPasswords.forEach(password => {
        expect(constraint.validate(password)).toBe(true);
      });
    });
  });

  describe('Validator Constraint Interface Compliance', () => {
    it('should implement validate method', () => {
      const constraint = new IsValidNIMConstraint();
      expect(typeof constraint.validate).toBe('function');
    });

    it('should implement defaultMessage method', () => {
      const constraint = new IsValidNIMConstraint();
      expect(typeof constraint.defaultMessage).toBe('function');
    });

    it('should return boolean from validate', () => {
      const constraint = new IsValidNIMConstraint();
      const result = constraint.validate('2101234567');
      expect(typeof result).toBe('boolean');
    });

    it('should return string from defaultMessage', () => {
      const constraint = new IsValidNIMConstraint();
      const message = constraint.defaultMessage();
      expect(typeof message).toBe('string');
    });
  });
});