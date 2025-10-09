export interface jwtPayload{
    user_id:string;
    nama:string;
    role:string;
    exp?: number; 
    iat?: number; 
    iss?: string; 
    sub?: string; 
    aud?: string;
}