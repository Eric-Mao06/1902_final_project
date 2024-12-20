from fastapi import APIRouter, Depends, HTTPException, Header
from models.user import User
from dependencies import get_db
from typing import Dict, Any
import voyageai
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/check")
async def check_user_exists(email: str, db = Depends(get_db)):
    user_model = User(db)
    user = await user_model.get_user_by_email(email)
    return {"exists": user is not None}

@router.get("/profile")
async def get_user_profile(email: str = None, db = Depends(get_db)):
    logger.info(f"Fetching profile for email: {email}")
    user_model = User(db)
    user = await user_model.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert ObjectId to string for JSON serialization
    if '_id' in user:
        user['_id'] = str(user['_id'])
    
    # Format response data
    profile_data = {
        "name": user.get("name", ""),  # Ensure name has a default value
        "email": user.get("email", ""),
        "location": user.get("location", ""),
        "company": user.get("company", ""),
        "role": user.get("role", ""),
        "summary": user.get("summary", ""),
        "linkedinUrl": user.get("linkedinUrl", ""),
        "photoUrl": user.get("photoUrl", ""),
        "_id": user.get("_id", "")
    }
    
    logger.debug(f"Returning profile data: {profile_data}")
    return {"profile": profile_data}

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
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to update user")
            
        # Format response data
        response_data = {
            "name": updated_user.get("name", ""),  # Ensure name has a default value
            "email": updated_user.get("email", ""),
            "location": updated_user.get("location", ""),
            "company": updated_user.get("company", ""),
            "role": updated_user.get("role", ""),
            "summary": updated_user.get("summary", ""),
            "linkedinUrl": updated_user.get("linkedinUrl", ""),
            "photoUrl": updated_user.get("photoUrl", ""),
            "_id": str(updated_user.get("_id", ""))
        }
        
        return {"profile": response_data}
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
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
