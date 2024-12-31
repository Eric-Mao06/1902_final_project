from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Dict, Any
from src.user import User
from dependencies import get_db
from src.linkedin_profile import scrape_linkedin_profile, get_stored_linkedin_data
import voyageai
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize VoyageAI
voyage_api_key = os.getenv("VOYAGE_API_KEY")
if not voyage_api_key:
    raise ValueError("VOYAGE_API_KEY environment variable is not set")
voyageai.api_key = voyage_api_key

@router.post("/linkedin-scrape")
async def linkedin_scrape_endpoint(data: Dict[str, str]):
    try:
        linkedin_url = data.get("linkedinUrl")
        return await scrape_linkedin_profile(linkedin_url)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scrape LinkedIn profile: {str(e)}")

@router.get("/linkedin-data/{data_id}")
async def get_linkedin_data(data_id: str):
    return get_stored_linkedin_data(data_id)

@router.get("/user/profile")
async def get_user_profile(
    email: str = Header(...),
    db = Depends(get_db)
):
    try:
        logger.info(f"Getting user profile for email: {email}")
        
        user_model = User(db)
        user = await user_model.get_user_by_email(email)
        
        if not user:
            logger.error(f"No user found for email: {email}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Convert ObjectId to string for JSON serialization
        if '_id' in user:
            user['_id'] = str(user['_id'])
            
        # Format response data
        response_data = {
            "name": user.get("name"),
            "email": user.get("email"),
            "location": user.get("location"),
            "company": user.get("company"),
            "role": user.get("role"),
            "summary": user.get("summary"),
            "linkedinUrl": user.get("linkedinUrl"),
            "photoUrl": user.get("photoUrl"),
            "_id": user.get("_id")
        }
        
        logger.debug(f"Formatted response data: {response_data}")
        return {"profile": response_data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_user_profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/complete-signup")
async def complete_signup(
    user_data: Dict[str, Any],
    db = Depends(get_db)
):
    try:
        print("\n=== Starting Complete Signup ===")
        
        # Check if we have all required fields
        required_fields = ["email", "name", "location", "linkedinUrl", "company", "role", "summary"]
        for field in required_fields:
            if field not in user_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Create user model instance
        user_model = User(db)
        
        # Check if user exists
        existing_user = await user_model.get_user_by_linkedin_url(user_data.get("linkedinUrl"))
        if existing_user:
            claimed_profile = await user_model.claim_profile(user_data.get("linkedinUrl"), user_data.get("email"))
            if claimed_profile:
                return {"userId": claimed_profile["_id"], "claimed": True}
            else:
                raise HTTPException(status_code=400, detail="Failed to claim existing profile")

        try:
            # Generate embedding for the summary using voyage-3 model
            embedding = voyageai.get_embedding(
                user_data["summary"],
                model="voyage-3-large"
            )
            
        except Exception as e:
            print(f"Error generating embedding: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")
        
        try:
            # Create user in database
            user_id = await user_model.create_user(
                user_data=user_data,
                raw_linkedin_data=user_data.get("raw_data", {}),
                embedding=embedding
            )
            return {"userId": user_id}
            
        except Exception as e:
            print(f"Database error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to create user in database: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in complete_signup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error during signup: {str(e)}")
