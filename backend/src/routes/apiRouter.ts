import { Router } from 'express';
import authRoutes from './authRoutes';
import employeeRoutes from './employeeRoutes';
import adminRoutes from './adminRoutes';
import aiRoutes from './aiRoutes';

const apiRouter = Router();

// Mount modules
apiRouter.use('/auth', authRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/ai', aiRoutes);

export default apiRouter;
