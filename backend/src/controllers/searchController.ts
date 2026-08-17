import { Request, Response } from 'express';
import { Event, Media } from '../models';
import { searchFaces, isQdrantAvailable, localCosineSearch } from '../services/qdrantService';
import axios from 'axios';
import FormData from 'form-data';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

export const faceSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'Selfie photo is required.' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }

    const qdrantAvail = await isQdrantAvailable();
    
    if (!qdrantAvail) {
      console.warn(`[Search] Qdrant unavailable, falling back to local MongoDB cosine search for event ${eventId}`);
    }

    // Call Python AI Service to extract face from selfie
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);

    let aiResponse;
    try {
      aiResponse = await axios.post(`${AI_SERVICE_URL}/detect-faces`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
    } catch (aiErr: any) {
      console.error('AI Service Error:', aiErr.response?.data || aiErr.message);
      res.status(500).json({ error: 'Failed to process selfie image.' });
      return;
    }

    const faces = aiResponse.data.faces || [];
    
    if (faces.length === 0) {
      res.status(400).json({ error: 'No face detected in the photo. Please try a clearer selfie.' });
      return;
    }
    
    if (faces.length > 1) {
      res.status(400).json({ error: 'Multiple faces detected. Please upload a photo containing only you.' });
      return;
    }

    const userEmbedding = faces[0].embedding;
    
    // Get search threshold from event settings or use default 0.5
    const threshold = event.searchThreshold || 0.45;

    // Search Qdrant for matches (or fallback)
    let searchResults;
    if (qdrantAvail) {
      searchResults = await searchFaces(eventId, userEmbedding, 50, threshold);
    } else {
      searchResults = await localCosineSearch(eventId, userEmbedding, 50, threshold);
    }

    if (searchResults.length === 0) {
      res.status(200).json({ 
        message: 'No matches found',
        matches: [] 
      });
      return;
    }

    // Extract unique media IDs
    const uniqueMediaIds = new Set<string>();
    const scoredMatches: Record<string, number> = {}; // Keep highest score for each photo

    for (const hit of searchResults) {
      const mediaId = hit.payload?.mediaId as string;
      if (mediaId) {
        uniqueMediaIds.add(mediaId);
        if (!scoredMatches[mediaId] || hit.score > scoredMatches[mediaId]) {
          scoredMatches[mediaId] = hit.score;
        }
      }
    }

    // Fetch original media metadata
    const matchedMedia = await Media.find({
      _id: { $in: Array.from(uniqueMediaIds) }
    }).lean();

    // Sort by highest similarity score
    const sortedMedia = matchedMedia.sort((a, b) => {
      const scoreA = scoredMatches[a._id.toString()] || 0;
      const scoreB = scoredMatches[b._id.toString()] || 0;
      return scoreB - scoreA;
    }).map(media => {
      const score = scoredMatches[media._id.toString()] || 0;
      return {
        ...media,
        similarityPercent: Math.round(score * 100),
        confidence: score > 0.65 ? 'HIGH' : score > 0.5 ? 'MEDIUM' : 'LOW'
      };
    });

    res.status(200).json({
      matches: sortedMedia,
      count: sortedMedia.length,
      totalSearched: uniqueMediaIds.size
    });
  } catch (error) {
    console.error('Face search error:', error);
    res.status(500).json({ error: 'Internal server error during face search.' });
  }
};
