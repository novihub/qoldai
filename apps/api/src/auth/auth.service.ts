import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  SendVerificationCodeDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    });

    // Send verification code
    await this.sendVerificationCode({ email: user.email });

    return {
      message: 'Registration successful. Please verify your email.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      ...tokens,
    };
  }

  async sendVerificationCode(dto: SendVerificationCodeDto) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing codes for this email
    await this.prisma.verificationCode.deleteMany({
      where: { email: dto.email },
    });

    // Create new verification code
    await this.prisma.verificationCode.create({
      data: {
        email: dto.email,
        code,
        expiresAt,
      },
    });

    // Send email
    await this.mailService.sendVerificationCode(dto.email, code);

    return { message: 'Verification code sent' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        email: dto.email,
        code: dto.code,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { email: dto.email },
      data: { emailVerified: new Date() },
    });

    // Delete used code
    await this.prisma.verificationCode.delete({
      where: { id: verificationCode.id },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      ...tokens,
    };
  }

  async validateOAuthUser(profile: {
    email: string;
    name: string;
    image?: string;
    provider: string;
    providerAccountId: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
      include: { accounts: true },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          image: profile.image,
          emailVerified: new Date(),
          accounts: {
            create: {
              type: 'oauth',
              provider: profile.provider,
              providerAccountId: profile.providerAccountId,
            },
          },
        },
        include: { accounts: true },
      });
    } else {
      // Check if account exists
      const existingAccount = user.accounts.find(
        (acc: Account) =>
          acc.provider === profile.provider &&
          acc.providerAccountId === profile.providerAccountId,
      );

      if (!existingAccount) {
        // Link account
        await this.prisma.account.create({
          data: {
            userId: user.id,
            type: 'oauth',
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
          },
        });
      }

      // Update email verified if not already
      if (!user.emailVerified) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
          include: { accounts: true },
        });
      }
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
