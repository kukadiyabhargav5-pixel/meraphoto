import { Router } from 'express';
import { rebuildFaceIndex, retryFailedIndexing, getFaceIndexStatus, getPhotoFaces, getEventFaceClusters } from '../controllers/faceIndexController';
import { authenticateJWT, requireRoles } from '../middlewares/auth';

const router = Router();

// Event face clusters (accessible to studio dashboard and event viewers)
router.get('/clusters/:eventId', getEventFaceClusters);

// These routes should be restricted to Studio Owners and Admins
router.use(authenticateJWT);
router.use(requireRoles(['STUDIO_OWNER', 'TEAM_MEMBER', 'SUPER_ADMIN']));

// Face Index Diagnostic & Rebuild Routes
router.get('/status/:eventId', getFaceIndexStatus);
router.post('/rebuild/:eventId', rebuildFaceIndex);
router.post('/retry/:eventId', retryFailedIndexing);
router.get('/photo/:mediaId', getPhotoFaces);

export default router;
