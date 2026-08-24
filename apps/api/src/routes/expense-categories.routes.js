import { Router } from 'express';
import { expenseCategoriesController } from '../controllers/expense-categories.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validate.js';
import { createExpenseCategorySchema, updateExpenseCategorySchema } from '../validators/expense-categories.validators.js';

const router = Router();

router.use(authenticate, authorize('owner'));

router.get('/', expenseCategoriesController.list);
router.post('/', validateBody(createExpenseCategorySchema), expenseCategoriesController.create);
router.patch('/:id', validateBody(updateExpenseCategorySchema), expenseCategoriesController.update);
router.delete('/:id', expenseCategoriesController.remove);

export default router;
