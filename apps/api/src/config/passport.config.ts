import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { config } from './index.js';
import { User, Company } from '../models/index.js';

/**
 * Configure Passport.js authentication strategies
 */
export function configurePassport(): void {
  // JWT Strategy for API authentication
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.jwtSecret,
      },
      async (payload, done) => {
        try {
          const user = await User.findById(payload.userId);
          if (!user) {
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // Google OAuth Strategy (only configure if credentials are provided)
  if (config.googleClientId && config.googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.googleClientId,
          clientSecret: config.googleClientSecret,
          callbackURL: config.googleCallbackUrl,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Extract profile info
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName || profile.name?.givenName || 'User';
            const avatarURL = profile.photos?.[0]?.value;
            const googleId = profile.id;

            // Pass profile to route handler (company context needed there)
            return done(null, {
              googleId,
              email,
              name,
              avatarURL,
            });
          } catch (error) {
            return done(error as Error, undefined);
          }
        }
      )
    );
  }

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
}
