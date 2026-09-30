import mongoose, { Schema, Document } from 'mongoose';

export interface IFaceEmbedding extends Document {
  mediaId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  studioId: mongoose.Types.ObjectId;
  embedding: number[]; // 512-dimension vector
  bbox: number[]; // [x1, y1, x2, y2]
  faceThumbnailUrl?: string; // Base64 or separate R2 image link for the crop
  timestamp?: number; // For video matching, holds the timestamp in seconds
  detectionConfidence?: number; // det_score from InsightFace (0-1)
  faceQuality?: number; // Composite quality score (0-1)
  modelVersion?: string; // e.g. 'buffalo_l_v1'
  imageWidth?: number; // Source image width
  imageHeight?: number; // Source image height
  createdAt: Date;
  updatedAt: Date;
}

const FaceEmbeddingSchema = new Schema<IFaceEmbedding>({
  mediaId: { type: Schema.Types.ObjectId, ref: 'Media', required: true, index: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  studioId: { type: Schema.Types.ObjectId, ref: 'Studio', required: true },
  embedding: { type: [Number], required: true }, // We will index this in MongoDB Atlas Vector Search
  bbox: { type: [Number], required: true },
  faceThumbnailUrl: { type: String },
  timestamp: { type: Number }, // Optional: used for identifying timestamp in videos
  detectionConfidence: { type: Number },
  faceQuality: { type: Number },
  modelVersion: { type: String, default: 'buffalo_l_v1' },
  imageWidth: { type: Number },
  imageHeight: { type: Number }
}, {
  timestamps: true
});

// If using MongoDB Atlas Vector Search, you would configure an index like:
// {
//   "fields": [
//     {
//       "type": "vector",
//       "path": "embedding",
//       "numDimensions": 512,
//       "similarity": "cosine"
//     }
//   ]
// }

export const FaceEmbedding = mongoose.model<IFaceEmbedding>('FaceEmbedding', FaceEmbeddingSchema);
