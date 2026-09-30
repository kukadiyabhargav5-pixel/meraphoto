import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models';

export interface AuthRequest extends Request {
  user?: IUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'default_super_secret_jwt_access_token_key_1234';

/**
 * Middleware to authenticate requests via JWT
 */
export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    
    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
};

/**
 * Middleware to enforce role requirements (RBAC)
 */
export const requireRoles = (roles: Array<'SUPER_ADMIN' | 'STUDIO_OWNER' | 'TEAM_MEMBER' | 'CLIENT'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRole = (req.user.role || 'CLIENT').toUpperCase();
    const userEmail = (req.user.email || '').toLowerCase();

    // Super Admin has unrestricted access to all routes
    if (userRole === 'SUPER_ADMIN' || userEmail === 'maraphoto303@gmail.com') {
      return next();
    }

    const upperRoles = roles.map(r => r.toUpperCase());
    if (!upperRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }

    next();
  };
};

/**
 * Utility to check if a user has Super Admin privileges.
 * Checks both the role field and the known admin email.
 */
export const isSuperAdmin = (user?: IUser | null): boolean => {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();
  const email = (user.email || '').toLowerCase();
  return role === 'SUPER_ADMIN' || email === 'maraphoto303@gmail.com';
};
