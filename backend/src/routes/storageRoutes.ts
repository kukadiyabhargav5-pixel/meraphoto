import { Router } from 'express';
import {
  getStoragePlans,
  getStorageSubscription,
  getStorageUsage,
  getStorageActivity,
  createStorageCheckoutOrder,
  verifyStoragePayment,
  getAdminStorageOverview,
  adminAdjustUserStorageLimit,
  adminExtendSubscription,
  adminCancelSubscription,
} from '../controllers/storageController';
import { authenticateJWT, requireRoles } from '../middlewares/auth';

const router = Router();

// Public / Authenticated Plan Listing
router.get('/plans', getStoragePlans);

// User Storage & Subscription Endpoints (Protected)
router.get('/subscription', authenticateJWT, getStorageSubscription);
router.get('/usage', authenticateJWT, getStorageUsage);
router.get('/activity', authenticateJWT, getStorageActivity);
router.post('/checkout', authenticateJWT, createStorageCheckoutOrder);
router.post('/verify-payment', authenticateJWT, verifyStoragePayment);

// Super Admin Management Endpoints
router.get('/admin/overview', authenticateJWT, requireRoles(['SUPER_ADMIN']), getAdminStorageOverview);
router.post('/admin/adjust-limit', authenticateJWT, requireRoles(['SUPER_ADMIN']), adminAdjustUserStorageLimit);
router.post('/admin/extend-subscription', authenticateJWT, requireRoles(['SUPER_ADMIN']), adminExtendSubscription);
router.post('/admin/cancel-subscription', authenticateJWT, requireRoles(['SUPER_ADMIN']), adminCancelSubscription);

export default router;

