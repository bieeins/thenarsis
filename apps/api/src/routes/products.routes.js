import { Router } from 'express';
import { productsController } from '../controllers/products.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { productSchema, productUpdateSchema, productListQuerySchema } from '../validators/products.validators.js';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(productListQuerySchema), productsController.list);
router.get('/:id', productsController.get);
router.post('/', authorize('owner'), validateBody(productSchema), productsController.create);
router.patch('/:id', authorize('owner'), validateBody(productUpdateSchema), productsController.update);
router.delete('/:id', authorize('owner'), productsController.remove);

export default router;
