import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import productsRoutes from './products.routes.js';
import ordersRoutes from './orders.routes.js';
import orderItemsRoutes from './order-items.routes.js';
import expensesRoutes from './expenses.routes.js';
import expenseCategoriesRoutes from './expense-categories.routes.js';
import invoicesRoutes from './invoices.routes.js';
import designWorkRoutes from './design-work.routes.js';
import crewAssignmentsRoutes from './crew-assignments.routes.js';
import paymentsRoutes from './payments.routes.js';
import notificationsRoutes from './notifications.routes.js';
import designIncomeRoutes from './design-income.routes.js';
import notesRoutes from './notes.routes.js';
import filesRoutes from './files.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Thenarsis API is healthy' });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);
router.use('/order-items', orderItemsRoutes);
router.use('/expenses', expensesRoutes);
router.use('/expense-categories', expenseCategoriesRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/design-work', designWorkRoutes);
router.use('/crew-assignments', crewAssignmentsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/design-income', designIncomeRoutes);
router.use('/notes', notesRoutes);
router.use('/files', filesRoutes);

export default router;
