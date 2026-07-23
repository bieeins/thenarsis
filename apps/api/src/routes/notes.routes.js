import { Router } from 'express';
import { notesController } from '../controllers/notes.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { createNoteSchema, updateNoteSchema } from '../validators/notes.validators.js';

const router = Router();

router.use(authenticate);

router.get('/', notesController.list);
router.post('/', validateBody(createNoteSchema), notesController.create);
router.patch('/:id', validateBody(updateNoteSchema), notesController.update);
router.delete('/:id', notesController.remove);

export default router;
