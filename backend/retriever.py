import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import config

def get_embedding_function():
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def retrieve_context(query, k=8):
    db = Chroma(
        persist_directory=config.CHROMA_PATH,
        embedding_function=get_embedding_function()
    )
    
    results = db.similarity_search(query, k=k)
    
    if not results:
        return ""
    
    context = "\n\n---\n\n".join([doc.page_content for doc in results])
    return context

def get_rag_response(query):
    context = retrieve_context(query)
    
    if not context:
        return "I'm sorry, I don't have information about that. Please contact us directly."
        
    prompt = ChatPromptTemplate.from_messages([
        ("system", config.SYSTEM_PROMPT),
        ("human", "Context:\n{context}\n\nQuestion: {question}")
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
    
    return response.content

if __name__ == "__main__":
    import sys
    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What pizzas do you have?"
    print(f"🔍 Question: {query}\n")
    
    response = get_rag_response(query)
    print(f"🤖 Answer: {response}\n")
