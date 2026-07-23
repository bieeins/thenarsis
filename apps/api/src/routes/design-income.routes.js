import { Router } from 'express';
import { designIncomeController } from '../controllers/design-income.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createDesignIncomeSchema, updateDesignIncomeSchema, designIncomeListQuerySchema } from '../validators/design-income.validators.js';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(designIncomeListQuerySchema), designIncomeController.list);
router.get('/:id', designIncomeController.get);
router.post('/', validateBody(createDesignIncomeSchema), designIncomeController.create);
router.patch('/:id', validateBody(updateDesignIncomeSchema), designIncomeController.update);
router.delete('/:id', designIncomeController.remove);

export default router;
