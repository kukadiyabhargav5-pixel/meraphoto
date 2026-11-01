import { Router } from 'express';
import {
  getMyStudio,
  updateMyStudio,
  getStudioCredits,
  updateStudioPlan,
  uploadStudioLogo,
  deleteStudioLogo,
  getPublicStudio,
  getStudioBranding,
  updateStudioBranding,
  uploadStudioBanner,
  deleteStudioBanner,
} from '../controllers/studioController';
import { authenticateJWT } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

// Public studio branding route (no auth required for clients/visitors)
router.get('/public/:slug', getPublicStudio);

// Studio Profile & Credits
router.get('/me', authenticateJWT, getMyStudio);
router.get('/credits', authenticateJWT, getStudioCredits);
router.put('/me', authenticateJWT, updateMyStudio);

// Studio Branding Management (authenticated studio owner)
router.get('/branding', authenticateJWT, getStudioBranding);
router.put('/branding', authenticateJWT, updateStudioBranding);

// Assets Upload / Management
router.post('/logo', authenticateJWT, upload.any(), uploadStudioLogo);
router.delete('/logo', authenticateJWT, deleteStudioLogo);
router.post('/banner', authenticateJWT, upload.any(), uploadStudioBanner);
router.delete('/banner', authenticateJWT, deleteStudioBanner);

// Plan
router.post('/plan', authenticateJWT, updateStudioPlan);

export default router;
