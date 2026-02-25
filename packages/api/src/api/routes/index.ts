import { Router } from 'express';
import quoteRoutes from './quote.routes';

const router = Router();

// Mount quote routes
router.use('/quotes', quoteRoutes);

// Future routes
// router.use('/customers', customerRoutes);
// router.use('/products', productRoutes);
// router.use('/payments', paymentRoutes);

export default router;
