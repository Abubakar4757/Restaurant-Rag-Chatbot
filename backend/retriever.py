import os
import json
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
try:
    from langchain_community.retrievers import BM25Retriever
    BM25_AVAILABLE = True
except ImportError:
    BM25_AVAILABLE = False
    print("WARNING: rank_bm25 not available, falling back to vector-only search")
import config

def get_embedding_function():
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def _doc_key(doc: Document) -> str:
    metadata = doc.metadata or {}
    return "::".join([
        str(metadata.get("source_filename", "")),
        str(metadata.get("chunk_index", "")),
        str(metadata.get("page", "")),
        str(hash(doc.page_content)),
    ])


def _rrf_merge(result_sets, k=8, rrf_k=60):
    scores = {}
    docs_by_key = {}

    for docs in result_sets:
        for rank, doc in enumerate(docs, start=1):
            key = _doc_key(doc)
            docs_by_key[key] = doc
            scores[key] = scores.get(key, 0.0) + (1.0 / (rrf_k + rank))

    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    return [docs_by_key[key] for key, _ in ranked[:k]]

def retrieve_context_with_sources(query, k=8):
    db = Chroma(
        persist_directory=config.CHROMA_PATH,
        embedding_function=get_embedding_function()
    )

    results_with_scores = db.similarity_search_with_relevance_scores(query, k=1)
    max_score = results_with_scores[0][1] if results_with_scores else 0

    vector_results = db.similarity_search(query, k=k)

    bm25_results = []
    if BM25_AVAILABLE:
        all_docs = db.get()
        if all_docs and all_docs.get("documents"):
            documents = [
                Document(page_content=doc, metadata=meta)
                for doc, meta in zip(all_docs["documents"], all_docs["metadatas"])
            ]
            bm25_retriever = BM25Retriever.from_documents(documents)
            bm25_retriever.k = k
            bm25_results = bm25_retriever.invoke(query)

    results = _rrf_merge([vector_results, bm25_results], k=k)
    
    if not results:
        return "", [], 0
    
    context = "\n\n---\n\n".join([doc.page_content for doc in results])
    sources = []
    for doc in results:
        source = doc.metadata.get("source_filename", "Unknown")
        page = doc.metadata.get("page")
        source_str = f"{source} (Page {page})" if page is not None else source
        if source_str not in sources:
            sources.append(source_str)
            
    return context, sources, max_score

def rewrite_query(query, history):
    if not history:
        return query
        
    llm = ChatGroq(
        api_key=config.GROQ_API_KEY,
        model=config.GROQ_MODEL
    )
    
    # Format history for the prompt
    history_str = ""
    for msg in history[-5:]: # Last 5 turns
        role = "Customer" if msg["role"] == "user" else "Assistant"
        history_str += f"{role}: {msg['text']}\n"
        
    prompt = f"""Given the following conversation history and the latest user question, rewrite the latest question to be a standalone search query that captures all necessary context. 
    
History:
{history_str}

Latest Question: {query}

Standalone Query:"""
    
    response = llm.invoke(prompt)
    return response.content

def generate_suggested_questions(answer):
    llm = ChatGroq(
        api_key=config.GROQ_API_KEY,
        model=config.GROQ_MODEL
    )
    
    prompt = f"""Given the following answer from a restaurant chatbot, suggest 2-3 short, relevant follow-up questions a customer might ask. 
    Return ONLY the questions, separated by newlines, no numbers.
    
    Answer: {answer}"""
    
    response = llm.invoke(prompt)
    questions = [q.strip() for q in response.content.split('\n') if q.strip()]
    return questions[:3]

GREETINGS = {"hi", "hello", "hey", "hola", "yo", "sup", "good morning", "good evening", "good afternoon", "howdy", "salam", "assalamualaikum"}

def _is_greeting(query):
    return query.strip().lower().rstrip("!.,?") in GREETINGS

def get_rag_stream(query, history=[]):
    if _is_greeting(query):
        yield "Hello! Welcome to Luigi's Trattoria. How can I help you today? You can ask about our menu, hours, reservations, or anything else!"
        return

    standalone_query = rewrite_query(query, history)
    context, sources, max_score = retrieve_context_with_sources(standalone_query)
    
    if max_score < -0.5 or not context:
        yield "I couldn't find that in the restaurant's documents. You may want to ask a staff member."
        return

    history_str = ""
    if history:
        for msg in history[-5:]:
            role = "Customer" if msg["role"] == "user" else "Assistant"
            history_str += f"{role}: {msg['text']}\n"
            
    prompt = ChatPromptTemplate.from_messages([
        ("system", config.SYSTEM_PROMPT),
        ("human", f"Conversation History:\n{history_str}\n\nContext:\n{{context}}\n\nQuestion: {{question}}\n\nAnswer based on the context above. If you use information from the documents, please cite them naturally if possible.")
    ])
    
    llm = ChatGroq(
        api_key=config.GROQ_API_KEY,
        model=config.GROQ_MODEL,
        streaming=True
    )
    
    chain = prompt | llm
    
    source_attribution = "\n\n**Sources:** " + ", ".join(sources) if sources else ""
    
    full_answer = ""
    for chunk in chain.stream({"context": context, "question": query}):
        full_answer += chunk.content
        yield chunk.content
        
    if source_attribution:
        yield source_attribution
        
    # Suggested questions
    suggestions = generate_suggested_questions(full_answer)
    if suggestions:
        yield f"\n\nSUGGESTIONS:{json.dumps(suggestions)}"

def get_rag_response(query, history=[]):
    if _is_greeting(query):
        return "Hello! Welcome to Luigi's Trattoria. How can I help you today? You can ask about our menu, hours, reservations, or anything else!"

    # Phase 2.2: Query Rewriting
    standalone_query = rewrite_query(query, history)
    print(f"🔍 Original: {query}")
    print(f"🔍 Standalone: {standalone_query}")
    
    context, sources, max_score = retrieve_context_with_sources(standalone_query)
    
    # Confidence-based fallback
    if max_score < -0.5 or not context:
        return "I couldn't find that in the restaurant's documents. You may want to ask a staff member."
        
    source_attribution = "\n\n**Sources:** " + ", ".join(sources) if sources else ""
    
    # Phase 2.1: Conversation Memory (using history in prompt)
    history_str = ""
    if history:
        for msg in history[-5:]:
            role = "Customer" if msg["role"] == "user" else "Assistant"
            history_str += f"{role}: {msg['text']}\n"
            
    prompt = ChatPromptTemplate.from_messages([
        ("system", config.SYSTEM_PROMPT),
        ("human", f"Conversation History:\n{history_str}\n\nContext:\n{{context}}\n\nQuestion: {{question}}\n\nAnswer based on the context above. If you use information from the documents, please cite them naturally if possible.")
    ])
    
    llm = ChatGroq(
        api_key=config.GROQ_API_KEY,
        model=config.GROQ_MODEL
    )
    
    chain = prompt | llm
    response = chain.invoke({
        "context": context,
        "question": query
    })
    
    return response.content + source_attribution

if __name__ == "__main__":
    import sys
    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What pizzas do you have?"
    print(f"🔍 Question: {query}\n")
    
    response = get_rag_response(query)
    print(f"🤖 Answer: {response}\n")
