import { JwtPayload } from '@/types';
export declare class JwtUtil {
    private static readonly secret;
    private static readonly expiresIn;
    static sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
    static verify(token: string): JwtPayload;
    static decode(token: string): JwtPayload | null;
}
//# sourceMappingURL=jwt.d.ts.map