import os
import sys
import io
import asyncio
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

# Force UTF-8 encoding for stdout
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    from app.face_engine import FaceEngine
except ImportError:
    from face_engine import FaceEngine

engine: Optional[FaceEngine] = None
is_engine_loading: bool = False

async def init_engine_background():
    """Load FaceEngine asynchronously in background thread so port binds instantly."""
    global engine, is_engine_loading
    is_engine_loading = True
    model_name = os.environ.get("INSIGHTFACE_MODEL", "buffalo_sc")
    print(f"[AI Service] Background initialization of InsightFace ({model_name}) started...")
    try:
        loop = asyncio.get_running_loop()
        new_engine = await loop.run_in_executor(None, FaceEngine)
        engine = new_engine
        if engine.ready:
            print(f"[AI Service] ✓ Engine ready with {model_name}. Face detection endpoints are live.")
        else:
            print("[AI Service] ⚠ Engine loaded in fallback/mock mode.")
    except Exception as e:
        print(f"[AI Service] ❌ Engine initialization failed: {e}")
    finally:
        is_engine_loading = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start loading engine in background task so port binds immediately
    asyncio.create_task(init_engine_background())
    yield

app = FastAPI(
    title="Mara Photo AI Service",
    description="FastAPI microservice for AI-powered face recognition using InsightFace",
    lifespan=lifespan,
)

# Enable CORS so frontend/backend can call directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_engine() -> FaceEngine:
    """Returns the engine when ready, or waits briefly if warming up."""
    global engine, is_engine_loading
    if engine and engine.ready:
        return engine

    if is_engine_loading:
        print("[AI Service] Request received while engine is warming up, waiting...")
        for _ in range(30):  # Wait up to 15 seconds
            await asyncio.sleep(0.5)
            if engine and engine.ready:
                return engine

    if not engine or not engine.ready:
        raise HTTPException(
            status_code=503,
            detail="AI engine is still warming up. Please retry in a few seconds."
        )
    return engine

@app.get("/health")
def health():
    model_name = os.environ.get("INSIGHTFACE_MODEL", "buffalo_sc")
    return {
        "status": "healthy",
        "model": model_name,
        "engine_ready": engine.ready if engine else False,
        "is_loading": is_engine_loading,
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
    eng = await get_engine()

    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file received.")

        faces = eng.extract_faces(contents)
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
    """
    eng = await get_engine()

    all_embeddings = []
    for file in files:
        try:
            contents = await file.read()
            if len(contents) == 0:
                continue

            faces = eng.extract_faces(contents)
            if faces:
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

    all_embeddings.sort(key=lambda x: x["quality"], reverse=True)
    best_embeddings = all_embeddings[:4]

    return {
        "embeddings": best_embeddings,
        "count": len(best_embeddings),
        "total_frames_processed": len(files),
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"[AI Service] Launching Uvicorn on 0.0.0.0:{port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
