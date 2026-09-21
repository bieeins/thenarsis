import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema, usersListQuerySchema, resetPasswordSchema } from '../validators/users.validators.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('owner'), validateQuery(usersListQuerySchema), usersController.list);
router.get('/:id', usersController.get);
router.post('/', authorize('owner'), validateBody(createUserSchema), usersController.create);
router.patch('/:id', validateBody(updateUserSchema), usersController.update);
router.put('/:id/password', authorize('owner'), validateBody(resetPasswordSchema), usersController.resetPassword);
router.delete('/:id', authorize('owner'), usersController.remove);

export default router;
