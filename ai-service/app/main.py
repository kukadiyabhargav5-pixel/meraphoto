import sys
import io
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import base64

# Force UTF-8 encoding for stdout to prevent crash on Windows when DeepFace prints emojis
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    from app.face_engine import FaceEngine
except ImportError:
    from face_engine import FaceEngine

app = FastAPI(
    title="Mara Photo AI Service",
    description="FastAPI microservice for AI-powered face recognition using InsightFace",
)

# Enable CORS so frontend/backend can call directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine: FaceEngine | None = None

@app.on_event("startup")
async def startup_event():
    global engine
    print("[AI Service] Initializing InsightFace engine...")
    engine = FaceEngine()
    if engine.ready:
        print("[AI Service] ✓ Engine ready. Face detection endpoints are live.")
    else:
        print("[AI Service] ⚠ Engine loaded in MOCK mode (insightface not available).")

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": "buffalo_l",
        "engine_ready": engine.ready if engine else False,
    }

# ================================================================
# ORIGINAL ENDPOINT — backward compatible
# ================================================================
@app.post("/detect-faces")
async def detect_faces(file: UploadFile = File(...)):
    """
    Accepts an image upload, detects all faces, and returns embeddings + thumbnails + quality metadata.
    Used by both:
      1. Upload pipeline (when photos are uploaded to an event)
      2. Selfie search (when a guest uploads their selfie to find matching photos)
    """
    if not engine:
        raise HTTPException(status_code=503, detail="AI engine is not initialized yet. Please wait.")

    try:
        contents = await file.read()

        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file received.")

        faces = engine.extract_faces(contents)
        return {
            "faces": faces,
            "count": len(faces),
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Face detection failed: {str(e)}")


# ================================================================
# MULTI-FRAME QUERY ENDPOINT — for multi-capture face search
# ================================================================
@app.post("/extract-query-embeddings")
async def extract_query_embeddings(files: List[UploadFile] = File(...)):
    """
    Accept multiple selfie frames, extract the best quality face embedding from each.
    Returns multiple embeddings for multi-frame matching which dramatically improves recall.
    
    The backend uses MAX(similarity) across all returned embeddings to reduce false negatives
    caused by a single blurry or poorly-lit webcam frame.
    """
    if not engine:
        raise HTTPException(status_code=503, detail="AI engine is not initialized yet. Please wait.")

    all_embeddings = []

    for file in files:
        try:
            contents = await file.read()
            if len(contents) == 0:
                continue

            faces = engine.extract_faces(contents)
            if faces:
                # Use the best quality face from each frame
                best = max(faces, key=lambda f: f.get("quality", 0))
                all_embeddings.append({
                    "embedding": best["embedding"],
                    "quality": best.get("quality", 0),
                    "det_score": best.get("det_score", 0),
                })
        except Exception as e:
            print(f"[AI Service] Warning: Failed to process frame: {e}")
            continue

    if not all_embeddings:
        raise HTTPException(
            status_code=400,
            detail="No face detected in any uploaded frame. Please ensure your face is clearly visible."
        )

    # Sort by quality descending, return up to 4 best embeddings
    all_embeddings.sort(key=lambda x: x["quality"], reverse=True)
    best_embeddings = all_embeddings[:4]

    return {
        "embeddings": best_embeddings,
        "count": len(best_embeddings),
        "total_frames_processed": len(files),
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

