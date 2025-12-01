import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { jwtConfig } from './config/jwt.config';
import { AuthModule } from './auth/auth.module';
import { GeneralModule } from './general/general.module';
import { BimbinganModule } from './bimbingan/bimbingan.module';
import { ProgressModule } from './progress/progress.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfileModule } from './profile/profil.module';
import { JadwalModule } from './jadwal/jadwal.module';
import { KegiatanModule } from './kegiatan/kegiatan.module';
import { RiwayatModule } from './riwayat/riwayat.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    cache: true,
    envFilePath: ['.env'],
    load: [() => ({ jwt: jwtConfig})]
  }), AuthModule, GeneralModule, BimbinganModule, ProgressModule, ProfileModule, JadwalModule, KegiatanModule, RiwayatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
