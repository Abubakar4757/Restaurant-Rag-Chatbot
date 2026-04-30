# Use official Python image
FROM python:3.10-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies (needed for ChromaDB and other ML libraries)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all the backend code
COPY . .

# Create the storage folders so RAG doesn't crash on startup
RUN mkdir -p docs vectorstore

# Use PORT env var (Render sets it), fallback to 7860 for HF Spaces
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}
