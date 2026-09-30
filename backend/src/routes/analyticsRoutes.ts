import { Router } from 'express';
import { getStudioAnalytics, getAdminAnalytics } from '../controllers/analyticsController';
import { authenticateJWT, requireRoles } from '../middlewares/auth';

const router = Router();

router.get('/studio', authenticateJWT, requireRoles(['STUDIO_OWNER', 'TEAM_MEMBER', 'CLIENT']), getStudioAnalytics);
router.get('/admin', authenticateJWT, requireRoles(['SUPER_ADMIN']), getAdminAnalytics);

export default router;
