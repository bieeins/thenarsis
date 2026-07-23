import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema, changePasswordSchema } from '../validators/auth.validators.js';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';
import { loginRateLimiter } from '../middleware/rate-limit.js';

const router = Router();

router.post('/login', loginRateLimiter, validateBody(loginSchema), authController.login);
router.post('/register', loginRateLimiter, optionalAuthenticate, validateBody(registerSchema), authController.register);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), authController.changePassword);

export default router;
