import { Router } from 'express';
import { filesController } from '../controllers/files.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.post('/', upload.single('file'), filesController.upload);
router.get('/:id/download', filesController.download);

export default router;
