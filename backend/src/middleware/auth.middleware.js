import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // the token may still be valid for a user that no longer exists
    // (e.g. after a DB reset), so always load the current user record
    const user = await User.findByPk(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'Your session is no longer valid. Please log in again.' });
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}