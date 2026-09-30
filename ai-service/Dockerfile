FROM python:3.10-slim

# Install system dependencies required by OpenCV and ONNX
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the InsightFace models during image build
# This avoids delay/failure on first request at runtime
RUN python -c "from insightface.app import FaceAnalysis; FaceAnalysis(name='buffalo_l')"

# Copy application source
COPY . .

# Expose FastAPI default port
EXPOSE 8000

# Run the app
CMD ["python", "app/main.py"]
