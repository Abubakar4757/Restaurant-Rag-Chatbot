from langchain_groq import ChatGroq
import config

llm = ChatGroq(
    api_key=config.GROQ_API_KEY,
    model=config.GROQ_MODEL
)

response = llm.invoke("Say hello in one sentence.")
print("✅ Groq connected:", response.content)
