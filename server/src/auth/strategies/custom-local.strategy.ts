// strategies/custom-local.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class CustomLocalStrategy extends PassportStrategy(Strategy, 'custom-local') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    // Extract identifier and password from request body
    const { identifier, password } = req.body;
    
    // Validate required fields
    if (!identifier || !password) {
      throw new UnauthorizedException({
        success: false,
        message: 'Missing credentials. Provide identifier (email or phone number) and password',
      });
    }
    
    // Validate user with identifier (can be email or phone number)
    const user = await this.authService.validateUser(identifier, password);
    
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
      });
    }
    
    return user;
  }
}