# Use official Python image
FROM python:3.10-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies (needed for ChromaDB and ML)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from the backend folder
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all the backend code into the container's root
COPY backend/ .

# Create the storage folders so RAG doesn't crash on startup
RUN mkdir -p docs vectorstore

# Hugging Face Spaces automatically exposes Port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
