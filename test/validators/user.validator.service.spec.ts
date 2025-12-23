import { Test, TestingModule } from '@nestjs/testing';
import { UserValidator } from '../../src/validators/user.validator';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('UserValidator Service', () => {
    let validator: UserValidator;
    let prisma: PrismaService;

    const mockPrisma = {
        users: {
            findUnique: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserValidator,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        validator = module.get<UserValidator>(UserValidator);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(validator).toBeDefined();
    });

    describe('validateUser - Success Cases', () => {
        it('should return user payload when user exists', async () => {
            const mockUser = {
                user_id: '2101234567',
                nama: 'John Doe',
                role: 'mahasiswa',
                no_whatsapp: '081234567890',
                sandi: 'hashedpassword',
                photo_url: null,
                status_user: 'active',
                created_at: new Date(),
                updated_at: new Date(),
                judul: null,
                judul_temp: null,
            };

            mockPrisma.users.findUnique.mockResolvedValue(mockUser);

            const result = await validator.validateUser('2101234567');

            expect(result).toEqual({
                user_id: '2101234567',
                nama: 'John Doe',
                role: 'mahasiswa',
            });

            expect(prisma.users.findUnique).toHaveBeenCalledWith({
                where: {
                    user_id: '2101234567',
                },
            });
        });

        it('should validate dosen user correctly', async () => {
            const mockDosen = {
                user_id: 'DSN001',
                nama: 'Dr. Jane Smith',
                role: 'dosen',
                no_whatsapp: '081234567890',
                sandi: 'hashedpassword',
                photo_url: null,
                status_user: 'active',
                created_at: new Date(),
                updated_at: new Date(),
                judul: null,
                judul_temp: null,
            };

            mockPrisma.users.findUnique.mockResolvedValue(mockDosen);

            const result = await validator.validateUser('DSN001');

            expect(result).toEqual({
                user_id: 'DSN001',
                nama: 'Dr. Jane Smith',
                role: 'dosen',
            });
        });

        it('should validate admin user correctly', async () => {
            const mockAdmin = {
                user_id: 'ADM001',
                nama: 'Admin User',
                role: 'admin',
                no_whatsapp: '081234567890',
                sandi: 'hashedpassword',
                photo_url: null,
                status_user: 'active',
                created_at: new Date(),
                updated_at: new Date(),
                judul: null,
                judul_temp: null,
            };

            mockPrisma.users.findUnique.mockResolvedValue(mockAdmin);

            const result = await validator.validateUser('ADM001');

            expect(result).toEqual({
                user_id: 'ADM001',
                nama: 'Admin User',
                role: 'admin',
            });
        });
    });


    describe('validateUser - Failure Cases', () => {
        it('should throw UnauthorizedException when user not found', async () => {
            mockPrisma.users.findUnique.mockResolvedValue(null);

            await expect(validator.validateUser('INVALID_ID')).rejects.toThrow(
                UnauthorizedException,
            );

            await expect(validator.validateUser('INVALID_ID')).rejects.toThrow(
                'User tidak ditemukan',
            );
        });

        it('should throw UnauthorizedException for non-existent mahasiswa', async () => {
            mockPrisma.users.findUnique.mockResolvedValue(null);

            await expect(validator.validateUser('9999999999')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException for non-existent dosen', async () => {
            mockPrisma.users.findUnique.mockResolvedValue(null);

            await expect(validator.validateUser('DSN999')).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });

    describe('validateUser - Error Handling', () => {
        it('should propagate UnauthorizedException from try-catch', async () => {
            mockPrisma.users.findUnique.mockResolvedValue(null);

            await expect(validator.validateUser('TEST')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should handle database errors and rethrow', async () => {
            const dbError = new Error('Database connection failed');
            mockPrisma.users.findUnique.mockRejectedValue(dbError);

            await expect(validator.validateUser('TEST')).rejects.toThrow(
                'Database connection failed',
            );
        });

        it('should log error to console', async () => {
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => { });

            mockPrisma.users.findUnique.mockResolvedValue(null);

            try {
                await validator.validateUser('TEST');
            } catch (error) {
            }

            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('should handle prisma query errors', async () => {
            const prismaError = new Error('Prisma query error');
            mockPrisma.users.findUnique.mockRejectedValue(prismaError);

            await expect(validator.validateUser('TEST')).rejects.toThrow(
                'Prisma query error',
            );
        });
    });

    describe('validateUser - Edge Cases', () => {
        it('should handle empty string user_id', async () => {
            mockPrisma.users.findUnique.mockResolvedValue(null);

            await expect(validator.validateUser('')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should handle whitespace user_id', async () => {
            mockPrisma.users.findUnique.mockResolvedValue(null);

            await expect(validator.validateUser('   ')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should validate user with special characters in name', async () => {
            const mockUser = {
                user_id: 'TEST001',
                nama: "O'Brien-Smith Jr.",
                role: 'mahasiswa',
                no_whatsapp: '081234567890',
                sandi: 'hashedpassword',
                photo_url: null,
                status_user: 'active',
                created_at: new Date(),
                updated_at: new Date(),
                judul: null,
                judul_temp: null,
            };

            mockPrisma.users.findUnique.mockResolvedValue(mockUser);

            const result = await validator.validateUser('TEST001');

            expect(result.nama).toBe("O'Brien-Smith Jr.");
        });

        it('should validate user with very long name', async () => {
            const longName = 'A'.repeat(255);
            const mockUser = {
                user_id: 'TEST002',
                nama: longName,
                role: 'dosen',
                no_whatsapp: '081234567890',
                sandi: 'hashedpassword',
                photo_url: null,
                status_user: 'active',
                created_at: new Date(),
                updated_at: new Date(),
                judul: null,
                judul_temp: null,
            };

            mockPrisma.users.findUnique.mockResolvedValue(mockUser);

            const result = await validator.validateUser('TEST002');

            expect(result.nama).toBe(longName);
        });
    });

    describe('validateUser - Return Value Structure', () => {
        it('should return only user_id, nama, and role', async () => {
            const mockUser = {
                user_id: 'TEST',
                nama: 'Test User',
                role: 'mahasiswa',
                no_whatsapp: '081234567890',
                sandi: 'secret_password',
                photo_url: 'https://example.com/photo.jpg',
                status_user: 'active',
                created_at: new Date(),
                updated_at: new Date(),
                judul: 'Judul TA',
                judul_temp: 'Temp Judul',
            };

            mockPrisma.users.findUnique.mockResolvedValue(mockUser);

            const result = await validator.validateUser('TEST');

            expect(Object.keys(result)).toEqual(['user_id', 'nama', 'role']);
            expect(result).not.toHaveProperty('sandi');
            expect(result).not.toHaveProperty('no_whatsapp');
            expect(result).not.toHaveProperty('photo_url');
        });

        it('should not expose sensitive user data', async () => {
            const mockUser = {
                user_id: 'SECURE',
                nama: 'Secure User',
                role: 'admin',
                no_whatsapp: '081234567890',
                sandi: '$2b$12$hashedpassword',
                photo_url: null,
                status_user: 'active',
                created_at: new Date(),
                updated_at: new Date(),
                judul: null,
                judul_temp: null,
            };

            mockPrisma.users.findUnique.mockResolvedValue(mockUser);

            const result = await validator.validateUser('SECURE');

            expect(result.sandi).toBeUndefined();
            expect(result.no_whatsapp).toBeUndefined();
        });
    });
});
