import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('AppController - Complete Coverage', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined();
    });

    it('should have appService injected', () => {
      expect(appController['appService']).toBeDefined();
      expect(appController['appService']).toBeInstanceOf(AppService);
    });
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('should call appService.getHello()', () => {
      const spy = jest.spyOn(appService, 'getHello');
      appController.getHello();
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should return string type', () => {
      const result = appController.getHello();
      expect(typeof result).toBe('string');
    });
  });

  describe('with different service implementations', () => {
    it('should work with mocked service', async () => {
      const mockAppService = {
        getHello: jest.fn().mockReturnValue('Mocked Hello!'),
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          {
            provide: AppService,
            useValue: mockAppService,
          },
        ],
      }).compile();

      const controller = module.get<AppController>(AppController);
      expect(controller.getHello()).toBe('Mocked Hello!');
    });

    it('should work with factory provider', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          {
            provide: AppService,
            useFactory: () => ({
              getHello: () => 'Factory Hello!',
            }),
          },
        ],
      }).compile();

      const controller = module.get<AppController>(AppController);
      expect(controller.getHello()).toBe('Factory Hello!');
    });

    it('should work with class provider', async () => {
      class MockAppService {
        getHello() {
          return 'Class Hello!';
        }
      }

      const module: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          {
            provide: AppService,
            useClass: MockAppService,
          },
        ],
      }).compile();

      const controller = module.get<AppController>(AppController);
      expect(controller.getHello()).toBe('Class Hello!');
    });
  });

  describe('edge cases', () => {
    it('should handle multiple calls', () => {
      const result1 = appController.getHello();
      const result2 = appController.getHello();
      const result3 = appController.getHello();
      
      expect(result1).toBe('Hello World!');
      expect(result2).toBe('Hello World!');
      expect(result3).toBe('Hello World!');
    });

    it('should maintain service instance', () => {
      const service1 = appController['appService'];
      const service2 = appController['appService'];
      expect(service1).toBe(service2);
    });
  });
});