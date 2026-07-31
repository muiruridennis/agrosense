import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/create-user.dto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async createUser(input: RegisterDto): Promise<User> {
    // Hash password here — never store plain text
    const hashed = await bcrypt.hash(input.password, 12);

    const user = this.usersRepository.create({
      email: input.email,
      phoneNumber: input.phoneNumber.trim(),
      fullName: input.fullName.trim(),
      password: hashed, // hashed, not raw
      role: (input.role as UserRole) ?? UserRole.FARMER,
      preferredLanguage: input.preferredLanguage ?? 'en',
    });

    return this.usersRepository.save(user);
  }

  async getById(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} was not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      throw new NotFoundException(`User with email ${email} was not found`);
    }
    return user;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { phoneNumber: phoneNumber.trim() },
    });
    if (!user) {
      throw new NotFoundException(
        `User with phone number ${phoneNumber} was not found`,
      );
    }
    return user;
  }

  async createFromPhone(phoneNumber: string, fullName?: string): Promise<User> {
    const normalizedPhone = phoneNumber.trim();
    const user = this.usersRepository.create({
      phoneNumber: normalizedPhone,
      fullName: fullName?.trim() || 'Invited user',
      password: null,
      role: UserRole.FARMER,
      preferredLanguage: 'en',
      isPhoneVerified: false,
    });

    return this.usersRepository.save(user);
  }

  async markPhoneVerified(userId: string): Promise<void> {
    const updateResult = await this.usersRepository.update(
      { id: userId },
      { isPhoneVerified: true },
    );

    if (updateResult.affected === 0) {
      throw new NotFoundException(`User ${userId} was not found`);
    }
  }

  async markEmailAsVerified(email: string) {
    return this.usersRepository.update(
      { email },
      {
        isEmailVerified: true,
      },
    );
  }
  async resetPassword(email: string, hashedPassword: string): Promise<void> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.password = hashedPassword;
    user.currentHashedRefreshToken = null;

    await this.usersRepository.save(user);
  }
  async updateLastLogin(userId: string, timestamp: Date): Promise<void> {
    const updateResult = await this.usersRepository.update(
      { id: userId },
      { lastLoginAt: timestamp },
    );

    if (updateResult.affected === 0) {
      throw new UnauthorizedException('Unable to update last login');
    }
  }
  async setCurrentRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(
      { id: userId },
      {
        currentHashedRefreshToken: hashed,
      },
    );
  }

  async getUserIfRefreshTokenMatches(
    refreshToken: string,
    userId: string,
  ): Promise<User> {
    const user = await this.getById(userId);

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken || '',
    );

    if (isRefreshTokenMatching) {
      return user;
    }

    // Add a return statement or throw an error
    throw new Error('Refresh token does not match');
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.usersRepository.update(
      { id: userId },
      { currentHashedRefreshToken: null },
    );
  }

  async getAll(): Promise<Partial<User>[]> {
    return this.usersRepository.find({
      select: ['id', 'fullName', 'email', 'phoneNumber', 'role', 'createdAt'],
    });
  }
  async delete(id: string): Promise<{ message: string }> {
    const user = await this.getById(id);
    await this.usersRepository.delete({ id });
    return { message: `User ${user.fullName} with ID ${id} has been deleted.` };
  }
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return await bcrypt.hash(password, salt);
  }
}
