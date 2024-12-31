from fastapi import APIRouter, Depends, HTTPException, Header
from src.user import User
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
        "name": user.get("name", ""),
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
        logger.info(f"Updating profile for email: {email}")
        logger.debug(f"Profile data: {profile_data}")
        
        user_model = User(db)
        user = await user_model.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Generate new embedding if summary changed
        if "summary" in profile_data and profile_data["summary"] != user["summary"]:
            try:
                embedding = voyageai.get_embedding(
                    profile_data["summary"],
                    model="voyage-3-large"
                )
                profile_data["summary_embedding"] = embedding
            except Exception as e:
                logger.error(f"Error generating embedding: {e}")
                # Continue without embedding if it fails
                pass

        updated_user = await user_model.update_user(email, profile_data)
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to update user")
            
        # Format response data
        response_data = {
            "name": updated_user.get("name", ""),
            "email": updated_user.get("email", ""),
            "location": updated_user.get("location", ""),
            "company": updated_user.get("company", ""),
            "role": updated_user.get("role", ""),
            "summary": updated_user.get("summary", ""),
            "linkedinUrl": updated_user.get("linkedinUrl", ""),
            "photoUrl": updated_user.get("photoUrl", ""),
            "_id": str(updated_user.get("_id", ""))
        }
        
        logger.info(f"Successfully updated profile for {email}")
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
        return {"message": "Profile deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
