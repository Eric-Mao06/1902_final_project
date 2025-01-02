from fastapi import APIRouter, Depends, HTTPException, Header
from src.user import User
from dependencies import get_db
from typing import Dict, Any
import voyageai
import logging
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

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
    
    # Connect to UPenn database's profilematch collection
    mongodb_uri = os.getenv('MONGODB_URI')
    mongo_client = AsyncIOMotorClient(mongodb_uri)
    upenn_db = mongo_client['UPenn']
    profilematch_collection = upenn_db['profilematch']
    
    # Try to get user from profilematch collection first
    user = await profilematch_collection.find_one({"email": email})
    
    # If not found in profilematch, fall back to users collection
    if not user:
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
        
        # Connect to UPenn database's profilematch collection
        mongodb_uri = os.getenv('MONGODB_URI')
        mongo_client = AsyncIOMotorClient(mongodb_uri)
        upenn_db = mongo_client['UPenn']
        profilematch_collection = upenn_db['profilematch']
        
        # Try to get user from profilematch collection first
        user = await profilematch_collection.find_one({"email": email})
        
        # If not found in profilematch, fall back to users collection
        if not user:
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

        # Add updated timestamp and remove _id field
        update_data = profile_data.copy()
        update_data["updated_at"] = datetime.utcnow()
        update_data.pop("_id", None)  # Remove _id if present

        # Update both collections
        # Update profilematch collection first
        result = await profilematch_collection.find_one_and_update(
            {"email": email},
            {"$set": update_data},
            return_document=True,
            upsert=True  # Create if doesn't exist
        )

        # Then update users collection
        user_model = User(db)
        updated_user = await user_model.update_user(email, update_data)
        if not updated_user and not result:
            raise HTTPException(status_code=500, detail="Failed to update user in both collections")

        # Use the profilematch data for response if available, otherwise fall back to users collection
        response_user = result or updated_user
            
        # Format response data
        response_data = {
            "name": response_user.get("name", ""),
            "email": response_user.get("email", ""),
            "location": response_user.get("location", ""),
            "company": response_user.get("company", ""),
            "role": response_user.get("role", ""),
            "summary": response_user.get("summary", ""),
            "linkedinUrl": response_user.get("linkedinUrl", ""),
            "photoUrl": response_user.get("photoUrl", ""),
            "_id": str(response_user.get("_id", ""))
        }
        
        logger.info(f"Successfully updated profile for {email}")
        return {"profile": response_data}
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/update")
async def update_user_profile_from_linkedin(email: str, profile_data: Dict[str, Any], db = Depends(get_db)):
    try:
        logger.info(f"Updating profile from LinkedIn for email: {email}")
        
        # Connect to UPenn database's profilematch collection
        mongodb_uri = os.getenv('MONGODB_URI')
        mongo_client = AsyncIOMotorClient(mongodb_uri)
        upenn_db = mongo_client['UPenn']
        profilematch_collection = upenn_db['profilematch']
        
        # Try to get user from profilematch collection first
        user = await profilematch_collection.find_one({"email": email})
        
        # If not found in profilematch, fall back to users collection
        if not user:
            user_model = User(db)
            user = await user_model.get_user_by_email(email)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

        linkedin_url = profile_data.get("linkedinUrl")
        if not linkedin_url:
            raise HTTPException(status_code=400, detail="LinkedIn URL is required")

        # Import here to avoid circular imports
        from src.linkedin_profile import scrape_linkedin_profile
        
        # Scrape new LinkedIn data
        scraped_data = await scrape_linkedin_profile(linkedin_url)
        if not scraped_data:
            raise HTTPException(status_code=500, detail="Failed to scrape LinkedIn profile")

        # Extract profile data from scraped data (excluding name)
        profile_update = {
            "location": scraped_data.get("location", user.get("location", "")),
            "company": scraped_data.get("company", user.get("company", "")),
            "role": scraped_data.get("role", user.get("role", "")),
            "summary": scraped_data.get("summary", user.get("summary", "")),
            "photoUrl": scraped_data.get("photoUrl", user.get("photoUrl", "")),
            "raw_linkedin_data": scraped_data.get("raw_linkedin_data", {}),
            "updated_at": datetime.utcnow()
        }

        # Generate new embedding for the summary
        if profile_update["summary"]:
            try:
                embedding = voyageai.get_embedding(
                    profile_update["summary"],
                    model="voyage-3-large"
                )
                profile_update["summary_embedding"] = embedding
            except Exception as e:
                logger.error(f"Error generating embedding: {e}")
                # Continue without embedding if it fails
                pass

        # Update both collections
        # Update profilematch collection first
        result = await profilematch_collection.find_one_and_update(
            {"email": email},
            {"$set": profile_update},
            return_document=True,
            upsert=True  # Create if doesn't exist
        )

        # Then update users collection
        user_model = User(db)
        updated_user = await user_model.update_user(email, profile_update)
        if not updated_user and not result:
            raise HTTPException(status_code=500, detail="Failed to update user in both collections")

        # Use the profilematch data for response if available, otherwise fall back to users collection
        response_user = result or updated_user
        
        # Format response data
        response_data = {
            "name": response_user.get("name", ""),  # Keep existing name
            "email": response_user.get("email", ""),
            "location": response_user.get("location", ""),
            "company": response_user.get("company", ""),
            "role": response_user.get("role", ""),
            "summary": response_user.get("summary", ""),
            "linkedinUrl": response_user.get("linkedinUrl", ""),
            "photoUrl": response_user.get("photoUrl", ""),
            "_id": str(response_user.get("_id", ""))
        }

        logger.info(f"Successfully updated profile from LinkedIn for {email}")
        return {"profile": response_data}
    except Exception as e:
        logger.error(f"Error updating profile from LinkedIn: {str(e)}")
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
