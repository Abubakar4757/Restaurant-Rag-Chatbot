import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# As llama3-8b-8192 is decommissioned, we are using the official 8B replacement
GROQ_MODEL = "llama-3.1-8b-instant"

# Use absolute paths for robust resolution
if os.getenv("RENDER"):
    DATA_DIR = "/data"
else:
    DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

CHROMA_PATH = os.path.join(DATA_DIR, "vectorstore")
DOCS_PATH = os.path.join(DATA_DIR, "docs")

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

SYSTEM_PROMPT = """You are a friendly and concise restaurant assistant.
You must answer the user's question based ONLY on the provided context.
If the context does not contain the answer, you must not make up information. Instead, reply EXACTLY with this phrase: "I'm sorry, I don't have information about that. Please contact us directly."

CRITICAL RULES:
1. NEVER assume the user's identity, loyalty tier, or personal information unless explicitly stated by the user.
2. When mentioning perks or loyalty programs, refer to them generally rather than telling the user they qualify for them.
"""
