import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID')!;
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET')!;
    super({
      clientID,
      clientSecret,
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:4000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, username, emails, photos } = profile;
    const user = {
      id,
      email: emails?.[0]?.value || `${username}@github.com`,
      name: profile.displayName || username,
      avatar_url: photos?.[0]?.value,
    };
    done(null, user);
  }
}
