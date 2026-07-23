import { Router } from 'express';
import { designWorkController } from '../controllers/design-work.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createDesignWorkSchema, updateDesignWorkSchema, designWorkListQuerySchema } from '../validators/design-work.validators.js';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(designWorkListQuerySchema), designWorkController.list);
router.get('/:id', designWorkController.get);
router.post('/', authorize('owner'), validateBody(createDesignWorkSchema), designWorkController.create);
router.patch('/:id', validateBody(updateDesignWorkSchema), designWorkController.update);
router.delete('/:id', authorize('owner'), designWorkController.remove);

export default router;
