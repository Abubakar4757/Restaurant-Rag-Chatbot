import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Using qwen/qwen3.6-27b as the active LLM model
GROQ_MODEL = "qwen/qwen3.6-27b"

# Use absolute paths for robust resolution
if os.getenv("RENDER"):
    DATA_DIR = "/data"
else:
    DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

CHROMA_PATH = os.path.join(DATA_DIR, "vectorstore")
DOCS_PATH = os.path.join(DATA_DIR, "docs")

CHUNK_SIZE = 500
CHUNK_OVERLAP = 150

SYSTEM_PROMPT = """You are a highly concise restaurant assistant.
Your answers must be extremely brief and direct. No introductions, no filler, no conclusions.

Answer ONLY from the provided context. If the context has relevant information, USE IT — even if the data is spread across multiple sections.
Only if the context truly has NO relevant information at all, reply with: "I'm sorry, I don't have information about that. Please contact us directly."

RULES:
1. Keep responses as short as possible. Use bulleted lists for menus.
2. When listing items, output ONLY names and prices. No descriptions unless asked.
3. NEVER assume user identity or loyalty tier.
4. Do NOT output any reasoning, thinking, or internal monologue.
/no_think
"""
