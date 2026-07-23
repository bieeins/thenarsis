import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { createNotificationSchema } from '../validators/notifications.validators.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationsController.list);
router.post('/', validateBody(createNotificationSchema), notificationsController.create);
router.patch('/:id/read', notificationsController.markRead);
router.delete('/:id', notificationsController.remove);

export default router;
