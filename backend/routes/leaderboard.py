from fastapi import APIRouter, HTTPException, Depends, Query
from src.leaderboard import LeaderboardSystem
from dependencies import get_db

router = APIRouter()

@router.get("/")
async def get_leaderboard(
    limit: int = Query(default=100, le=100),
    skip: int = Query(default=0, ge=0),
    db = Depends(get_db)
):
    try:
        leaderboard_system = LeaderboardSystem(db)
        results = await leaderboard_system.get_leaderboard(limit=limit, skip=skip)
        print(f"Leaderboard results: {results}")
        return {"leaderboard": results}
    except Exception as e:
        print(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))