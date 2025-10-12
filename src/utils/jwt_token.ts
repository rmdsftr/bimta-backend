import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { jwtPayload } from "../auth/interfaces/payload.js";

export interface TokenPair{
    access_token:string;
    refresh_token:string;
}

@Injectable()
export class JwtTokenUtil{
    private readonly jwtSecret:string;
    private readonly accessTokenExpiry:string;
    private readonly refreshTokenExpiry:string;

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService
    ){
        this.jwtSecret = this.configService.get<string>('jwt.secret') || 'fallback-secret';
        this.accessTokenExpiry = this.configService.get<string>('jwt.accessTokenExpiry') || '15m';
        this.refreshTokenExpiry = this.configService.get<string>('jwt.refreshTokenExpiry') || '7d';
    }

    async generateTokens(payload: jwtPayload): Promise<TokenPair>{
        const [access_token, refresh_token] = await Promise.all([
            this.generateAccessToken(payload),
            this.generateRefreshToken(payload)
        ])

        return {access_token, refresh_token}
    }

    private async generateAccessToken(payload:jwtPayload): Promise<string> {
        return this.jwtService.sign(payload, {
            secret: this.jwtSecret,
            expiresIn: this.accessTokenExpiry,
            issuer: 'bimta'
        })
    }

    private async generateRefreshToken(payload: jwtPayload): Promise<string> {
        return this.jwtService.sign(payload, {
            secret: this.jwtSecret,
            expiresIn: this.refreshTokenExpiry,
            issuer: 'bimta'
        })
    }

    verifyToken(token:string): jwtPayload{
        return this.jwtService.verify(token, {
            secret: this.jwtSecret,
            issuer: 'bimta'
        })
    }
}