import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

// Factory to conditionally provide OAuth strategies
const googleStrategyProvider = {
  provide: GoogleStrategy,
  useFactory: (configService: ConfigService) => {
    const clientId = configService.get('GOOGLE_CLIENT_ID');
    if (clientId) {
      return new GoogleStrategy(configService);
    }
    return null;
  },
  inject: [ConfigService],
};

const githubStrategyProvider = {
  provide: GithubStrategy,
  useFactory: (configService: ConfigService) => {
    const clientId = configService.get('GITHUB_CLIENT_ID');
    if (clientId) {
      return new GithubStrategy(configService);
    }
    return null;
  },
  inject: [ConfigService],
};

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, googleStrategyProvider, githubStrategyProvider],
  exports: [AuthService],
})
export class AuthModule {}
