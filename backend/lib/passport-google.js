import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";
import { signJwt } from "./jwt.js";

import { configDotenv } from "dotenv";
configDotenv();
3;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const SERVER_URL =
  process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4000}`;
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  "http://localhost:5173" ||
  "http://localhost:3000";

const GOOGLE_ENABLED = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
if (!GOOGLE_ENABLED) {
  console.warn("Google OAuth env vars not set. Google login is disabled.");
}

if (GOOGLE_ENABLED) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${SERVER_URL}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails &&
            profile.emails[0] &&
            profile.emails[0].value &&
            profile.emails[0].value.toLowerCase();
          if (!email) return done(new Error("Google profile has no email"));
          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              email,
              googleId: profile.id,
              name: profile.displayName,
              avatarUrl:
                profile.photos && profile.photos[0] && profile.photos[0].value,
            });
          } else if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          const id = user.id ?? user._id;
          const token = signJwt(id);
          return done(null, { id, token });
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
}

export function googleAuthStart() {
  if (!GOOGLE_ENABLED) {
    return (_req, res) =>
      res.status(503).json({ error: "Google login not configured" });
  }
  return passport.authenticate("google", { scope: ["profile", "email"] });
}

export function googleAuthCallback() {
  if (!GOOGLE_ENABLED) {
    return (_req, res) =>
      res.redirect(`${CLIENT_ORIGIN}/login?error=google_not_configured`);
  }
  return (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, data) => {
      if (err || !data || !data.token)
        return res.redirect(`${CLIENT_ORIGIN}/login?error=google_auth_failed`);
      res.cookie("token", data.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.redirect(CLIENT_ORIGIN);
    })(req, res, next);
  };
}
