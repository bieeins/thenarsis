import { Router } from 'express';
import { crewAssignmentsController } from '../controllers/crew-assignments.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createCrewAssignmentSchema, updateCrewAssignmentSchema, crewAssignmentsListQuerySchema } from '../validators/crew-assignments.validators.js';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(crewAssignmentsListQuerySchema), crewAssignmentsController.list);
router.get('/:id', crewAssignmentsController.get);
router.post('/', authorize('owner'), validateBody(createCrewAssignmentSchema), crewAssignmentsController.create);
router.patch('/:id', validateBody(updateCrewAssignmentSchema), crewAssignmentsController.update);
router.delete('/:id', authorize('owner'), crewAssignmentsController.remove);

export default router;
