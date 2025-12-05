import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  SendVerificationCodeDto,
  RefreshTokenDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('send-verification-code')
  sendVerificationCode(@Body() dto: SendVerificationCodeDto) {
    return this.authService.sendVerificationCode(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('refresh')
  refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Get('google')
  googleAuth(@Res() res: Response) {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Google OAuth is not configured');
    }
    // Redirect to the guarded route
    res.redirect('/auth/google/redirect');
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.validateOAuthUser({
      email: req.user.email,
      name: req.user.name,
      image: req.user.picture,
      provider: 'google',
      providerAccountId: req.user.id,
    });

    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
    );
  }

  @Get('github')
  githubAuth(@Res() res: Response) {
    const clientId = this.configService.get('GITHUB_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('GitHub OAuth is not configured');
    }
    // Redirect to the guarded route
    res.redirect('/auth/github/redirect');
  }

  @Get('github/redirect')
  @UseGuards(AuthGuard('github'))
  githubAuthRedirect() {
    // Initiates GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.validateOAuthUser({
      email: req.user.email,
      name: req.user.name,
      image: req.user.avatar_url,
      provider: 'github',
      providerAccountId: req.user.id.toString(),
    });

    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
    );
  }
}
