from sqlalchemy.orm import Session
from sqlalchemy import text
from app.embeddings import generate_embedding_query

def retrieve_relevant_tables(db: Session, workspace_id: int, question: str, top_k: int = 3):
    query_vector = generate_embedding_query(question)
    result = db.execute(
        text("""
            SELECT table_name, content, embedding <=> CAST(:qvec AS vector) AS distance
            FROM schema_embeddings
            WHERE workspace_id = :wsid
            ORDER BY distance
            LIMIT :k
        """),
        {"qvec": str(query_vector), "wsid": workspace_id, "k": top_k},
    )
    return [{"table_name": r.table_name, "content": r.content, "distance": r.distance} for r in result]