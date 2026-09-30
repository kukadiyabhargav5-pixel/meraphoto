import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Event, Media, Studio, User, FaceEmbedding } from '../models';

/**
 * Compile analytics metrics for a specific photography studio dashboard
 */
export const getStudioAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const studio = await Studio.findOne({ ownerId: req.user._id });
    if (!studio) return res.status(404).json({ error: 'Studio not found' });

    const totalEvents = await Event.countDocuments({ studioId: studio._id });
    const totalPhotos = await Media.countDocuments({ studioId: studio._id, type: 'PHOTO', processedStatus: 'COMPLETED' });
    const totalVideos = await Media.countDocuments({ studioId: studio._id, type: 'VIDEO', processedStatus: 'COMPLETED' });
    const totalEmbeddings = await FaceEmbedding.countDocuments({ studioId: studio._id });

    // Aggregate monthly upload trends for chart visualization
    const uploadTrends = await Media.aggregate([
      { $match: { studioId: studio._id, processedStatus: 'COMPLETED' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    // Format trends
    const trendsData = uploadTrends.map((t) => ({
      month: t._id,
      uploads: t.count,
    }));

    return res.json({
      stats: {
        totalEvents,
        totalPhotos,
        totalVideos,
        totalEmbeddings,
        searchesUsed: studio.usage.aiSearchesCount,
        plan: studio.subscriptionPlan,
        status: studio.subscriptionStatus,
      },
      trends: trendsData,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * SUPER ADMIN: Get consolidated statistics across all studios
 */
export const getAdminAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const totalStudios = await Studio.countDocuments({});
    const totalUsers = await User.countDocuments({});
    const totalEvents = await Event.countDocuments({});
    const totalPhotos = await Media.countDocuments({ type: 'PHOTO', processedStatus: 'COMPLETED' });
    const totalVideos = await Media.countDocuments({ type: 'VIDEO', processedStatus: 'COMPLETED' });

    // Sum overall storage space used
    const totalStorageUsage = await Media.aggregate([
      { $group: { _id: null, totalSize: { $sum: '$size' } } },
    ]);

    // Plan distributions
    const planDistribution = await Studio.aggregate([
      { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } },
    ]);

    return res.json({
      stats: {
        totalStudios,
        totalUsers,
        totalEvents,
        totalPhotos,
        totalVideos,
        storageBytesUsed: totalStorageUsage[0]?.totalSize || 0,
      },
      plans: planDistribution.map((p) => ({
        plan: p._id,
        count: p.count,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
