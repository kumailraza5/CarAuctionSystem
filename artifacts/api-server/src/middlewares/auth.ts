import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Support both Supabase JWT secret and legacy SESSION_SECRET
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const LEGACY_SECRET = process.env.SESSION_SECRET || "fallback_secret_key";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function verifyToken(token: string): AuthUser | null {
  // Try Supabase JWT first if secret is configured
  if (SUPABASE_JWT_SECRET) {
    try {
      const payload = jwt.verify(token, SUPABASE_JWT_SECRET) as any;
      // Supabase JWT has user data in different fields
      if (payload.sub || payload.id) {
        return {
          id: Number(payload.id || payload.sub),
          email: payload.email || "",
          role: payload.role || payload.user_role || "buyer",
        };
      }
    } catch {
      // Not a Supabase token, fall through to legacy
    }
  }

  // Fall back to our own JWT (legacy / custom auth)
  try {
    const payload = jwt.verify(token, LEGACY_SECRET) as AuthUser;
    return payload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const user = verifyToken(token);

  if (!user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = user;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = verifyToken(token);
    if (user) req.user = user;
  }
  next();
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, LEGACY_SECRET, { expiresIn: "7d" });
}
