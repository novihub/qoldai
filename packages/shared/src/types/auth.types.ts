import { User } from "./user.types";

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}

export interface SendVerificationCodeDto {
  email: string;
}
