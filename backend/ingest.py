import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import argparse
from langchain_community.document_loaders import PyMuPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import config

def get_embedding_function():
    # sentence-transformers via huggingface wrapper
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def ingest_document(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        loader = PyMuPDFLoader(file_path)
    elif ext == ".docx":
        loader = Docx2txtLoader(file_path)
    else:
        raise ValueError("Unsupported file type. Only PDF and DOCX are allowed.")

    docs = loader.load()
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP
    )
    chunks = splitter.split_documents(docs)
    
    print(f"✅ Split {os.path.basename(file_path)} into {len(chunks)} chunks.")

    db = Chroma(
        persist_directory=config.CHROMA_PATH,
        embedding_function=get_embedding_function()
    )
    
    # Store chunks
    db.add_documents(chunks)
    print(f"✅ Stored in ChromaDB at {config.CHROMA_PATH}")
    return len(chunks)

def delete_document(source_name):
    """
    Deletes all chunks associated with a specific source path/name.
    """
    db = Chroma(
        persist_directory=config.CHROMA_PATH,
        embedding_function=get_embedding_function()
    )
    
    # In langchain-chroma we can fetch and delete, but chromadb client allows delete with where clause
    collection = db._collection
    try:
        collection.delete(where={"source": {"$contains": source_name}})
        print(f"✅ Deleted document chunks containing source: {source_name}")
    except Exception as e:
        print(f"❌ Error deleting document: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest a document into Vectorstore")
    parser.add_argument("file_path", nargs="?", help="Path to the document to ingest")
    parser.add_argument("--delete", help="Delete a document by source name")
    
    args = parser.parse_args()
    
    if args.delete:
        delete_document(args.delete)
    elif args.file_path:
        ingest_document(args.file_path)
    else:
        print("Usage: python ingest.py <path_to_file> OR python ingest.py --delete <source_name>")
