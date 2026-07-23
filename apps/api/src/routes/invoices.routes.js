import { Router } from 'express';
import { invoicesController } from '../controllers/invoices.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createInvoiceSchema, updateInvoiceSchema, invoicesListQuerySchema } from '../validators/invoices.validators.js';

const router = Router();

// Public: matches PocketBase's public invoice viewRule for the customer-facing invoice page.
router.get('/public/:invoiceNumber', invoicesController.getPublicByNumber);

router.use(authenticate, authorize('owner'));

router.get('/', validateQuery(invoicesListQuerySchema), invoicesController.list);
router.get('/:id', invoicesController.get);
router.post('/', validateBody(createInvoiceSchema), invoicesController.create);
router.patch('/:id', validateBody(updateInvoiceSchema), invoicesController.update);
router.delete('/:id', invoicesController.remove);

export default router;
