import os
import cv2
import numpy as np
import base64
import traceback

try:
    from insightface.app import FaceAnalysis
    HAS_INSIGHTFACE = True
except ImportError:
    HAS_INSIGHTFACE = False

class FaceEngine:
    """Professional face detection & embedding engine using InsightFace."""

    def __init__(self):
        self.ready = False
        if HAS_INSIGHTFACE:
            print(f"[FaceEngine] Initializing InsightFace buffalo_l model...")
            try:
                # Initialize the FaceAnalysis app
                # det_size 1280x1280 for detecting small faces in large group photos
                self.app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
                self.app.prepare(ctx_id=0, det_size=(1280, 1280))
                self.ready = True
                print(f"[FaceEngine] ✓ InsightFace model loaded successfully.")
            except Exception as e:
                print(f"[FaceEngine] ✗ Failed to load InsightFace model: {e}")
                traceback.print_exc()
        else:
            print("[FaceEngine] WARNING: insightface package not found. Using Mock FaceEngine fallback.")

    def extract_faces(self, image_bytes: bytes) -> list:
        """
        Detect all faces in an image and return their embeddings + thumbnails + quality metadata.
        Returns a list of dicts: { bbox, embedding, thumbnail, det_score, quality, landmarks }
        """
        # Decode image from bytes
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image. Ensure file is a valid JPEG/PNG.")

        if not HAS_INSIGHTFACE or not self.ready:
            return self._mock_extract(img)

        results = []
        try:
            # Detect & embed all faces in image using InsightFace
            faces = self.app.get(img)
            img_h, img_w = img.shape[:2]

            for face in faces:
                embedding = face.embedding.tolist()
                bbox_array = face.bbox
                
                # InsightFace returns bbox as [x1, y1, x2, y2]
                x1, y1, x2, y2 = map(int, bbox_array)
                w = x2 - x1
                h = y2 - y1

                # Skip extremely small false positives, but keep tiny faces (12x12) for group photos
                if w < 12 or h < 12:
                    continue

                bbox = [float(x1), float(y1), float(x2), float(y2)]

                # Detection confidence score from InsightFace
                det_score = float(face.det_score) if hasattr(face, 'det_score') else 0.0

                # Composite face quality score based on:
                # - detection confidence (60% weight)
                # - face pixel area relative to 112x112 reference (40% weight)
                face_area = w * h
                reference_area = 112 * 112  # ArcFace alignment target size
                size_quality = min(1.0, face_area / reference_area)
                quality = det_score * 0.6 + size_quality * 0.4

                # Facial landmarks (5-point keypoints) for alignment verification
                landmarks = []
                if hasattr(face, 'kps') and face.kps is not None:
                    landmarks = face.kps.tolist()

                # Crop face thumbnail with generous padding for a nicer crop
                thumbnail_b64 = self._crop_face_thumbnail(img, x1, y1, w, h)

                results.append({
                    "bbox": bbox,
                    "embedding": embedding,
                    "thumbnail": thumbnail_b64,
                    "det_score": round(det_score, 4),
                    "quality": round(quality, 4),
                    "landmarks": landmarks,
                })

            print(f"[FaceEngine] Detected {len(results)} face(s) in image ({img_w}x{img_h}).")

        except Exception as e:
            print(f"[FaceEngine] Face detection error: {e}")
            traceback.print_exc()

        return results

    def _crop_face_thumbnail(self, img: np.ndarray, x: int, y: int, w: int, h: int) -> str:
        """Crop a face region with padding and encode as base64 JPEG."""
        img_h, img_w = img.shape[:2]

        # Add 25% padding around face for a natural-looking thumbnail
        pad_x = int(w * 0.25)
        pad_y = int(h * 0.25)

        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(img_w, x + w + pad_x)
        y2 = min(img_h, y + h + pad_y)

        face_crop = img[y1:y2, x1:x2]

        if face_crop.size == 0:
            return ""

        # Resize to consistent thumbnail size (160x160) for storage efficiency
        face_crop = cv2.resize(face_crop, (160, 160), interpolation=cv2.INTER_AREA)

        _, encoded = cv2.imencode('.jpg', face_crop, [cv2.IMWRITE_JPEG_QUALITY, 90])
        return base64.b64encode(encoded).decode('utf-8')

    def _mock_extract(self, img: np.ndarray) -> list:
        """Fallback mock for when insightface is not installed."""
        print("[FaceEngine] Using MOCK face extraction (insightface not available)")
        dummy_thumbnail = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        dummy_embedding = [0.0] * 512
        dummy_embedding[0] = 1.0
        return [{
            "bbox": [50.0, 50.0, 150.0, 150.0],
            "embedding": dummy_embedding,
            "thumbnail": dummy_thumbnail,
            "det_score": 0.99,
            "quality": 0.95,
            "landmarks": [],
        }]
