import { Router } from 'express';
import { 
  getAdminStats, 
  getAllUsers, 
  getAllStudios, 
  getAllEvents, 
  getMediaStats, 
  getAllTickets,
  deleteUser,
  deleteStudio,
  deleteEvent,
  getUserById,
  updateUser,
  getStudioById,
  updateStudio,
  getEventById,
  updateEvent,
  getStudioEvents,
  getEventVisitors
} from '../controllers/adminController';
import {
  getAllPlansAdmin,
  createPlan,
  updatePlan,
  togglePlanActive,
  archivePlan
} from '../controllers/pricingController';
import { adminGetStoragePlans, adminUpdateStoragePlan } from '../controllers/storageController';
import { authenticateJWT, requireRoles } from '../middlewares/auth';

const router = Router();

// Secure all admin routes with SUPER_ADMIN role
router.use(authenticateJWT, requireRoles(['SUPER_ADMIN']));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/studios', getAllStudios);
router.get('/events', getAllEvents);
router.get('/media', getMediaStats);
router.get('/support-tickets', getAllTickets);

// Single item routes
router.get('/users/:id', getUserById);
router.get('/studios/:id', getStudioById);
router.get('/studios/:id/events', getStudioEvents);
router.get('/events/:id', getEventById);
router.get('/events/:id/visitors', getEventVisitors);

// Update routes
router.put('/users/:id', updateUser);
router.put('/studios/:id', updateStudio);
router.put('/events/:id', updateEvent);

// Delete routes
router.delete('/users/:id', deleteUser);
router.delete('/studios/:id', deleteStudio);
router.delete('/events/:id', deleteEvent);

// Storage Plans Management (1 Month, 6 Months, 1 Year)
router.get('/storage-plans', adminGetStoragePlans);
router.put('/storage-plans/:planId', adminUpdateStoragePlan);

// Pricing Plan Management
router.get('/plans', getAllPlansAdmin);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.patch('/plans/:id/toggle', togglePlanActive);
router.delete('/plans/:id', archivePlan);

export default router;
