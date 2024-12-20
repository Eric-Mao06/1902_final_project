from fastapi import APIRouter, Depends, HTTPException
from models.user import User
from dependencies import get_db
import voyageai
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")  
async def search_users(query: str, offset: int = 0, db = Depends(get_db)):
    try:
        logger.info(f"Searching for users with query: {query}, offset: {offset}")
        # Generate embedding for the search query
        query_embedding = voyageai.get_embedding(
            query,
            model="voyage-3"
        )
        
        # Search for users using the embedding
        user_model = User(db)
        results = await user_model.search_users_by_embedding(query_embedding, offset=offset, limit=6)
        logger.info(f"Found {len(results)} results")
        
        return {"results": results}
    except Exception as e:
        logger.error(f"Error in search_users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
