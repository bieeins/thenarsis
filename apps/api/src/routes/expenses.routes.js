import { Router } from 'express';
import { expensesController } from '../controllers/expenses.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createExpenseSchema, updateExpenseSchema, expensesListQuerySchema } from '../validators/expenses.validators.js';

const router = Router();

router.use(authenticate, authorize('owner'));

router.get('/', validateQuery(expensesListQuerySchema), expensesController.list);
router.get('/:id', expensesController.get);
router.post('/', validateBody(createExpenseSchema), expensesController.create);
router.patch('/:id', validateBody(updateExpenseSchema), expensesController.update);
router.delete('/:id', expensesController.remove);

export default router;
