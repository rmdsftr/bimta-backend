import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await service.$disconnect();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect to database on module init', async () => {
    const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();
    
    await service.onModuleInit();
    
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should disconnect from database on module destroy', async () => {
    const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();
    
    await service.onModuleDestroy();
    
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('should have prisma client methods available', () => {
    expect(service.$connect).toBeDefined();
    expect(service.$disconnect).toBeDefined();
    expect(service.$transaction).toBeDefined();
  });
});