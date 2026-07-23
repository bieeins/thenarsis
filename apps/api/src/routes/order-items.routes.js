import { Router } from 'express';
import { orderItemsController } from '../controllers/order-items.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validate.js';
import { orderItemSchema, orderItemUpdateSchema } from '../validators/order-items.validators.js';

const router = Router();

router.use(authenticate, authorize('owner'));

router.get('/', orderItemsController.list);
router.get('/:id', orderItemsController.get);
router.post('/', validateBody(orderItemSchema), orderItemsController.create);
router.patch('/:id', validateBody(orderItemUpdateSchema), orderItemsController.update);
router.delete('/:id', orderItemsController.remove);

export default router;
