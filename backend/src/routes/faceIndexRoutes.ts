import { Router } from 'express';
import { rebuildFaceIndex, retryFailedIndexing, getFaceIndexStatus, getPhotoFaces } from '../controllers/faceIndexController';
import { authenticateJWT, requireRoles } from '../middlewares/auth';

const router = Router();

// These routes should be restricted to Studio Owners and Admins
router.use(authenticateJWT);
router.use(requireRoles(['STUDIO_OWNER', 'TEAM_MEMBER', 'SUPER_ADMIN']));

// Face Index Diagnostic & Rebuild Routes
router.get('/status/:eventId', getFaceIndexStatus);
router.post('/rebuild/:eventId', rebuildFaceIndex);
router.post('/retry/:eventId', retryFailedIndexing);
router.get('/photo/:mediaId', getPhotoFaces);

export default router;
