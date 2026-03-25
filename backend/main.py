import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import config
from ingest import ingest_document, delete_document
from retriever import get_rag_response

app = FastAPI(title="Restaurant RAG API")

# Add CORS Middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup: Create docs folder
@app.on_event("startup")
def startup_event():
    os.makedirs(config.DOCS_PATH, exist_ok=True)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"status": "RAG Chatbot API is running"}

@app.get("/documents")
def list_documents():
    if not os.path.exists(config.DOCS_PATH):
        return {"documents": []}
    files = [f for f in os.listdir(config.DOCS_PATH) if f.lower().endswith(('.pdf', '.docx')) and not f.startswith('.')]
    return {"documents": files}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    # Validate file extension
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed.")
    
    file_path = os.path.join(config.DOCS_PATH, file.filename)
    
    # Save the file cleanly
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Ingest to ChromaDB
        chunks_count = ingest_document(file_path)
        return {"filename": file.filename, "chunks_stored": chunks_count, "message": "Successfully uploaded and ingested."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    try:
        answer = get_rag_response(request.message)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")

@app.delete("/document/{filename}")
def delete_doc(filename: str):
    file_path = os.path.join(config.DOCS_PATH, filename)
    
    # Check physical file constraints
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found on server.")
        
    try:
        os.remove(file_path)
        # Remove from vectorstore using auxiliary function
        delete_document(filename)
        return {"message": f"Successfully deleted '{filename}' from storage and database."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
