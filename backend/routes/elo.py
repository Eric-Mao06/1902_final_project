from fastapi import APIRouter, HTTPException
from src.elo import EloSystem
from bson import ObjectId
from pydantic import BaseModel

router = APIRouter()
elo_system = EloSystem()

class VoteRequest(BaseModel):
    profile_id_a: str
    profile_id_b: str
    result: str

@router.get("/pair")
async def get_random_pair():
    try:
        profile1, profile2 = await elo_system.get_random_pair()
        return {"profiles": [profile1, profile2]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vote")
async def vote(vote_request: VoteRequest):
    try:
        if vote_request.result not in ["left", "right", "equal"]:
            raise HTTPException(status_code=400, detail="Invalid result value")

        new_rating_a, new_rating_b, changes = await elo_system.vote(
            vote_request.profile_id_a,
            vote_request.profile_id_b,
            vote_request.result
        )

        return {
            "success": True,
            "new_ratings": {
                "profile_a": new_rating_a,
                "profile_b": new_rating_b
            },
            "elo_changes": {
                "profile_a": changes[0],
                "profile_b": changes[1]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))