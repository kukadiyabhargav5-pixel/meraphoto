import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || 'http://127.0.0.1:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';

export const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

const COLLECTION_NAME = 'mara_faces';

export const isQdrantAvailable = async (): Promise<boolean> => {
  try {
    const health = await qdrantClient.api('cluster').clusterStatus();
    return health?.status === 'ok';
  } catch (err) {
    return false;
  }
};

export const initializeQdrant = async () => {
  try {
    const isAvail = await isQdrantAvailable();
    if (!isAvail) {
      console.warn('[Qdrant] Could not connect to Qdrant vector database. Face search will be unavailable.');
      return;
    }

    const { collections } = await qdrantClient.getCollections();
    const exists = collections.some(c => c.name === COLLECTION_NAME);
    
    if (!exists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 512, // InsightFace buffalo_l embedding size
          distance: 'Cosine'
        }
      });
      
      // Create payload index for fast filtering by eventId
      await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'eventId',
        field_schema: 'keyword'
      });
      
      console.log(`[Qdrant] Created collection '${COLLECTION_NAME}'`);
    } else {
      console.log(`[Qdrant] Collection '${COLLECTION_NAME}' already exists.`);
    }
  } catch (error) {
    console.error('[Qdrant] Error initializing Qdrant:', error);
  }
};

export const insertFaceEmbedding = async (
  eventId: string,
  mediaId: string,
  embedding: number[],
  faceId: string = uuidv4()
) => {
  try {
    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: faceId,
          vector: embedding,
          payload: {
            eventId,
            mediaId
          }
        }
      ]
    });
    return faceId;
  } catch (error) {
    console.error('[Qdrant] Error inserting face embedding:', error);
    throw error;
  }
};

export const searchFaces = async (
  eventId: string,
  queryEmbedding: number[],
  limit: number = 20,
  minScore: number = 0.5
) => {
  try {
    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit,
      score_threshold: minScore,
      filter: {
        must: [
          {
            key: 'eventId',
            match: {
              value: eventId
            }
          }
        ]
      }
    });
    
    return searchResult;
  } catch (error) {
    console.error('[Qdrant] Error searching faces:', error);
    throw error;
  }
};

// Fallback search using MongoDB when Qdrant is unavailable
export const localCosineSearch = async (
  eventId: string,
  queryEmbedding: number[],
  limit: number = 20,
  minScore: number = 0.5
) => {
  const { FaceEmbedding } = await import('../models');
  
  // Fetch all embeddings for this event
  const allFaces = await FaceEmbedding.find({ eventId }).lean();
  
  // Calculate cosine similarity manually
  const dotProduct = (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitude = (vec: number[]) => Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  
  const queryMag = magnitude(queryEmbedding);
  
  const results = allFaces.map(face => {
    const faceMag = magnitude(face.embedding);
    const score = dotProduct(queryEmbedding, face.embedding) / (queryMag * faceMag);
    return {
      id: face._id.toString(),
      score,
      payload: {
        eventId: face.eventId.toString(),
        mediaId: face.mediaId.toString()
      }
    };
  });
  
  // Filter by threshold, sort by score descending, and limit
  return results
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
