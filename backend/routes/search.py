from fastapi import APIRouter, Depends, HTTPException
from models.user import User
from dependencies import get_db
import voyageai
from typing import List

router = APIRouter()

@router.get("/search")
async def search_users(query: str, db = Depends(get_db)):
    try:
        # Generate embedding for the search query
        query_embedding = voyageai.get_embedding(
            query,
            model="voyage-3"
        )
        
        # Search for users using the embedding
        user_model = User(db)
        results = await user_model.search_users_by_embedding(query_embedding)
        
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
