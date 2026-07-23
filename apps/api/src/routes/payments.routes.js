import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createPaymentSchema, updatePaymentSchema, paymentsListQuerySchema } from '../validators/payments.validators.js';

const router = Router();

router.use(authenticate, authorize('owner'));

router.get('/', validateQuery(paymentsListQuerySchema), paymentsController.list);
router.get('/:id', paymentsController.get);
router.post('/', validateBody(createPaymentSchema), paymentsController.create);
router.patch('/:id', validateBody(updatePaymentSchema), paymentsController.update);
router.delete('/:id', paymentsController.remove);

export default router;
