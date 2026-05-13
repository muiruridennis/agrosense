import { CookieOptions } from 'express';

export interface AuthCookie {
  name: string;
  value: string;
  options: CookieOptions;
}