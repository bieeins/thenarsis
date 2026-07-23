import { forbidden, unauthorized } from '../utils/http-error.js';

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
