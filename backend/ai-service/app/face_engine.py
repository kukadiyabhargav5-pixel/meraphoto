import os
import io
import cv2
import numpy as np
import base64
import traceback
from PIL import Image, ImageOps

try:
    from insightface.app import FaceAnalysis
    from insightface.utils import face_align
    HAS_INSIGHTFACE = True
except ImportError:
    HAS_INSIGHTFACE = False


class FaceEngine:
    """Professional, high-accuracy face detection & embedding engine using InsightFace."""

    def __init__(self):
        self.ready = False
        if HAS_INSIGHTFACE:
            model_name = os.environ.get('INSIGHTFACE_MODEL', 'buffalo_sc')
            print(f"[FaceEngine] Initializing InsightFace {model_name} model...")
            try:
                # Initialize the FaceAnalysis app with buffalo_sc (SCRFD-500M + MobileFaceNet)
                # Only load detection and recognition modules (skipping genderage/landmarks saves ~250MB RAM!)
                self.app = FaceAnalysis(
                    name=model_name,
                    allowed_modules=['detection', 'recognition'],
                    providers=['CPUExecutionProvider']
                )
                self.app.prepare(ctx_id=-1, det_size=(640, 640))
                
                # Set sensitive detection threshold (0.35 instead of rigid 0.50)
                det_model = self.app.models.get('detection')
                if det_model:
                    det_model.det_thresh = 0.35

                self.ready = True
                print(f"[FaceEngine] [OK] InsightFace {model_name} loaded successfully with high-sensitivity detection.")
            except Exception as e:
                print(f"[FaceEngine] [FAIL] Failed to load InsightFace model: {e}")
                traceback.print_exc()
        else:
            print("[FaceEngine] WARNING: insightface package not found. Using Mock FaceEngine fallback.")

    def _decode_image_upright(self, image_bytes: bytes) -> np.ndarray:
        """
        Decode image bytes and automatically apply EXIF rotation (orientation tag).
        Ensures portrait photos taken on iPhones/Androids are not decoded sideways.
        """
        try:
            pil_img = Image.open(io.BytesIO(image_bytes))
            pil_img = ImageOps.exif_transpose(pil_img)
            if pil_img.mode != 'RGB':
                pil_img = pil_img.convert('RGB')
            return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception:
            nparr = np.frombuffer(image_bytes, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    def _enhance_contrast(self, img: np.ndarray) -> np.ndarray:
        """Apply CLAHE adaptive histogram equalization on luminance to recover dark/backlit faces."""
        try:
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
            cl = clahe.apply(l)
            enhanced = cv2.merge((cl, a, b))
            return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        except Exception:
            return img

    def _detect_faces_adaptive(self, img: np.ndarray) -> tuple[list, np.ndarray]:
        """
        Multi-pass adaptive detection to guarantee maximum face recall:
        - Pass 1: Standard (640x640) with det_thresh=0.35
        - Pass 2: Scale fallback (480x480) with det_thresh=0.30 (optimal for selfies / webcam)
        - Pass 3: CLAHE contrast boost for underexposed or backlit photos
        - Pass 4: Auto-rotation check (90° CW, 90° CCW, 180°) for stripped-EXIF photos
        Returns (faces, active_image)
        """
        det_model = self.app.models.get('detection')

        # Pass 1: Standard multi-scale detection
        if det_model:
            det_model.det_thresh = 0.35
            det_model.det_size = (640, 640)
        faces = self.app.get(img)
        if len(faces) > 0:
            return faces, img

        # Pass 2: Fallback for close-up selfies / webcam crops
        if det_model:
            det_model.det_thresh = 0.30
            det_model.det_size = (480, 480)
        faces = self.app.get(img)
        if len(faces) > 0:
            print("[FaceEngine] Faces detected via Pass 2 (480x480 scale fallback).")
            return faces, img

        # Pass 3: Contrast enhancement for low-light or backlit selfies
        enhanced = self._enhance_contrast(img)
        faces = self.app.get(enhanced)
        if len(faces) > 0:
            print("[FaceEngine] Faces detected via Pass 3 (CLAHE illumination recovery).")
            return faces, enhanced

        # Pass 4: Orientation fallback (handles stripped EXIF metadata from WhatsApp/web)
        for rot_name, rot_code in [
            ("90 CW", cv2.ROTATE_90_CLOCKWISE),
            ("90 CCW", cv2.ROTATE_90_COUNTERCLOCKWISE),
            ("180", cv2.ROTATE_180),
        ]:
            rotated = cv2.rotate(img, rot_code)
            faces = self.app.get(rotated)
            if len(faces) > 0:
                print(f"[FaceEngine] Faces detected via Pass 4 (Auto-rotation {rot_name}).")
                return faces, rotated

        # Reset det_size to default
        if det_model:
            det_model.det_thresh = 0.35
            det_model.det_size = (640, 640)

        return [], img

    def extract_faces(self, image_bytes: bytes) -> list:
        """
        Detect all faces in an image and return embeddings + thumbnails + quality metadata.
        Uses Flip Test-Time Augmentation (TTA) for world-class biometric matching accuracy.
        """
        img = self._decode_image_upright(image_bytes)
        if img is None:
            raise ValueError("Could not decode image. Ensure file is a valid JPEG/PNG/WebP.")

        if not HAS_INSIGHTFACE or not self.ready:
            return self._mock_extract(img)

        results = []
        try:
            faces, active_img = self._detect_faces_adaptive(img)
            img_h, img_w = active_img.shape[:2]
            rec_model = self.app.models.get('recognition')

            for face in faces:
                bbox_array = face.bbox
                x1, y1, x2, y2 = map(int, bbox_array)
                w = x2 - x1
                h = y2 - y1

                # Skip tiny noise specs
                if w < 10 or h < 10:
                    continue

                bbox = [float(x1), float(y1), float(x2), float(y2)]
                det_score = float(face.det_score) if hasattr(face, 'det_score') else 0.0

                # Flip-Test Augmentation (TTA) for enhanced recognition accuracy
                embedding = face.embedding.tolist() if hasattr(face, 'embedding') and face.embedding is not None else []
                if rec_model and hasattr(face, 'kps') and face.kps is not None:
                    try:
                        aligned = face_align.norm_crop(active_img, landmark=face.kps)
                        if aligned is not None:
                            feat1 = rec_model.get_feat(aligned)
                            feat2 = rec_model.get_feat(cv2.flip(aligned, 1))
                            combined = feat1 + feat2
                            norm = np.linalg.norm(combined)
                            if norm > 0:
                                combined = combined / norm
                                embedding = combined.flatten().tolist()
                    except Exception as tta_err:
                        print(f"[FaceEngine] TTA embedding fallback: {tta_err}")

                # Sharpness measurement using Laplacian variance on the face region
                sharpness_score = 0.5
                try:
                    face_roi = active_img[max(0, y1):min(img_h, y2), max(0, x1):min(img_w, x2)]
                    if face_roi.size > 0:
                        gray_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
                        lap_var = cv2.Laplacian(gray_roi, cv2.CV_64F).var()
                        sharpness_score = min(1.0, lap_var / 300.0)
                except Exception:
                    pass

                # Composite face quality score:
                # - Detection confidence (50%)
                # - Face area / resolution (30%)
                # - Sharpness (20%)
                face_area = w * h
                reference_area = 112 * 112
                size_quality = min(1.0, face_area / reference_area)
                quality = round(det_score * 0.5 + size_quality * 0.3 + sharpness_score * 0.2, 4)

                # Landmarks for visual alignment verification
                landmarks = []
                if hasattr(face, 'kps') and face.kps is not None:
                    landmarks = face.kps.tolist()

                # Crop face thumbnail
                thumbnail_b64 = self._crop_face_thumbnail(active_img, x1, y1, w, h)

                results.append({
                    "bbox": bbox,
                    "embedding": embedding,
                    "thumbnail": thumbnail_b64,
                    "det_score": round(det_score, 4),
                    "quality": quality,
                    "landmarks": landmarks,
                    "area": face_area,
                })

            # Sort results descending so results[0] is always the primary, highest quality subject
            results.sort(key=lambda x: (x["quality"], x["area"]), reverse=True)
            print(f"[FaceEngine] Detected {len(results)} face(s) in image ({img_w}x{img_h}). Primary face quality: {results[0]['quality'] if results else 'N/A'}")

        except Exception as e:
            print(f"[FaceEngine] Face detection error: {e}")
            traceback.print_exc()

        return results

    def _crop_face_thumbnail(self, img: np.ndarray, x: int, y: int, w: int, h: int) -> str:
        """Crop face thumbnail with 25% padding and return base64 JPEG."""
        img_h, img_w = img.shape[:2]
        pad_x = int(w * 0.25)
        pad_y = int(h * 0.25)

        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(img_w, x + w + pad_x)
        y2 = min(img_h, y + h + pad_y)

        face_crop = img[y1:y2, x1:x2]
        if face_crop.size == 0:
            return ""

        face_crop = cv2.resize(face_crop, (160, 160), interpolation=cv2.INTER_AREA)
        _, encoded = cv2.imencode('.jpg', face_crop, [cv2.IMWRITE_JPEG_QUALITY, 90])
        return base64.b64encode(encoded).decode('utf-8')

    def _mock_extract(self, img: np.ndarray) -> list:
        """Fallback mock."""
        print("[FaceEngine] Using MOCK face extraction.")
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
            "area": 10000,
        }]
