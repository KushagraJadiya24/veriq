import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.gemini_api_key)

def generate_embedding(text: str) -> list[float]:
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
        task_type="retrieval_document",
        output_dimensionality=768,
    )
    return result["embedding"]

def generate_embedding_query(text: str) -> list[float]:
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
        task_type="retrieval_query",
        output_dimensionality=768,
    )
    return result["embedding"]