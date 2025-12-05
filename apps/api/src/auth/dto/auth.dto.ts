import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class VerifyEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class SendVerificationCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
