import { verifyAccessToken } from '../utils/jwt.js';
import { unauthorized } from '../utils/http-error.js';
import { usersRepository } from '../repositories/users.repository.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw unauthorized('Authentication required');

    const payload = verifyAccessToken(token);
    const user = await usersRepository.findById(payload.sub);
    if (!user) throw unauthorized('Authentication required');

    req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch {
    next(unauthorized('Authentication required'));
  }
}

export async function optionalAuthenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    const payload = verifyAccessToken(token);
    const user = await usersRepository.findById(payload.sub);
    if (user) {
      req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    }
    next();
  } catch {
    next();
  }
}
