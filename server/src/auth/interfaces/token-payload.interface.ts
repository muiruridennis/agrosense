export interface TokenPayload {
  sub: string;       // user UUID
  phone: string;     // stable identifier
  role: string;
}

export interface RefreshTokenPayload extends TokenPayload {
  tokenFamily: string; // rotation family — detects refresh token reuse
}