import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtPayload } from '../interfaces/payload.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, 
      secretOrKey: process.env.JWT_SECRET || 'bimbingan-tugas-akhir-sistem-informasi-universitas-andalas-bimta', 
    });
  }
  
  async validate(payload: jwtPayload) {
    return { 
      userId: payload.user_id, 
      nama: payload.nama,
      role: payload.role
    };
  }
}
