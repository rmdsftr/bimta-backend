export const jwtConfig = {
    secret: process.env.JWT_SECRET || 'bimbingan-tugas-akhir-sistem-informasi-universitas-andalas-bimta',
    accessTokenExpiry: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenExpiry: process.env.REFRESH_EXPIRES_IN || '7d',
    issuer: 'bimta'
};