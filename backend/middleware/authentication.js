import { verifyJwt } from "../lib/jwt.js";
import { User } from "../models/User.js";

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = verifyJwt(token);
    req.userId = payload.sub;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function getUserFromReq(req) {
  const userId = req.userId;
  if (!userId) return null;
  return User.findById(userId).lean();
}

export default { requireAuth, getUserFromReq };
