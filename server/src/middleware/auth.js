import jwt from 'jsonwebtoken';
import { db } from '../services/dataStore.js';

export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_floorplan3d_2026_dev';
    const decoded = jwt.verify(token, secret);

    const user = await db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User associated with token no longer exists.' });
    }

    req.user = {
      id: String(user._id || user.id),
      _id: String(user._id || user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      specialization: user.specialization
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: requires one of [${allowedRoles.join(', ')}]` });
    }
    next();
  };
};
