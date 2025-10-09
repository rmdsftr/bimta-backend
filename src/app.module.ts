import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { jwtConfig } from './config/jwt.config';
import { GeneralModule } from './general/general.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    cache: true,
    envFilePath: ['.env'],
    load: [() => ({ jwt: jwtConfig})]
  }), AuthModule, GeneralModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
