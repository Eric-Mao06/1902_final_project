from fastapi import APIRouter, Depends, HTTPException
from models.user import User
from dependencies import get_db
from typing import Dict, Any
import voyageai

router = APIRouter()

@router.get("/check")
async def check_user_exists(email: str, db = Depends(get_db)):
    user_model = User(db)
    user = await user_model.get_user_by_email(email)
    return {"exists": user is not None}

@router.get("/profile")
async def get_user_profile(email: str, db = Depends(get_db)):
    user_model = User(db)
    user = await user_model.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/profile")
async def update_user_profile(email: str, profile_data: Dict[str, Any], db = Depends(get_db)):
    try:
        user_model = User(db)
        user = await user_model.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Generate new embedding if summary changed
        if "summary" in profile_data and profile_data["summary"] != user["summary"]:
            embedding = voyageai.get_embedding(
                profile_data["summary"],
                model="voyage-3"
            )
            profile_data["summary_embedding"] = embedding

        updated_user = await user_model.update_user(email, profile_data)
        return updated_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/profile")
async def delete_user_profile(email: str, db = Depends(get_db)):
    try:
        user_model = User(db)
        user = await user_model.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        await user_model.delete_user(email)
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
