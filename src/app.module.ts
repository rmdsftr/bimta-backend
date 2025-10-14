import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { jwtConfig } from './config/jwt.config.js';
import { AuthModule } from './auth/auth.module.js';
import { GeneralModule } from './general/general.module.js';
import { BimbinganModule } from './bimbingan/bimbingan.module.js';
import { ProgressModule } from './progress/progress.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProfileModule } from './profile/profil.module.js';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    cache: true,
    envFilePath: ['.env'],
    load: [() => ({ jwt: jwtConfig})]
  }), AuthModule, GeneralModule, BimbinganModule, ProgressModule, ProfileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
