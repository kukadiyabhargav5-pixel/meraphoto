FROM node:20-alpine

# Install FFmpeg and OpenCV system dependencies
RUN apk update && apk add --no-cache ffmpeg gcc g++ make python3

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Install dependencies including native builds for sharp
RUN npm install

# Copy application source
COPY . .

# Compile TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start Express server
CMD ["npm", "start"]
