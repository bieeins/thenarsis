import { Router } from 'express';
import { ordersController } from '../controllers/orders.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createOrderSchema, updateOrderSchema, ordersListQuerySchema } from '../validators/orders.validators.js';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(ordersListQuerySchema), ordersController.list);
router.get('/:id', ordersController.get);
router.get('/:id/items', ordersController.listItems);
router.post('/', authorize('owner'), validateBody(createOrderSchema), ordersController.create);
router.patch('/:id', authorize('owner'), validateBody(updateOrderSchema), ordersController.update);
router.delete('/:id', authorize('owner'), ordersController.remove);

export default router;
