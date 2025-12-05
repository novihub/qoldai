import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID')!;
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET')!;
    super({
      clientID,
      clientSecret,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:4000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    const user = {
      id,
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      picture: photos[0]?.value,
    };
    done(null, user);
  }
}
