from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Dict, Any
import requests
import os
from google import generativeai
from models.user import User
import voyageai
from dependencies import get_db
import uuid
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Gemini
generativeai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = generativeai.GenerativeModel('gemini-1.5-pro')
# Initialize VoyageAI
voyage_api_key = os.getenv("VOYAGE_API_KEY")
if not voyage_api_key:
    raise ValueError("VOYAGE_API_KEY environment variable is not set")
voyageai.api_key = voyage_api_key

# Temporary storage for LinkedIn data with TTL
linkedin_data_store = {}

def cleanup_old_data():
    # Remove data older than 1 hour
    current_time = datetime.now()
    expired_keys = [
        key for key, value in linkedin_data_store.items()
        if current_time - value['timestamp'] > timedelta(hours=1)
    ]
    for key in expired_keys:
        del linkedin_data_store[key]

@router.post("/linkedin-scrape")
async def scrape_linkedin_profile(data: Dict[str, str]):
    try:
        linkedin_url = data.get("linkedinUrl")
        if not linkedin_url:
            raise HTTPException(status_code=400, detail="LinkedIn URL is required")
        
        print(f"Attempting to scrape LinkedIn URL: {linkedin_url}")
        
        # Use RapidAPI LinkedIn API
        url = "https://linkedin-api8.p.rapidapi.com/get-profile-data-by-url"
        api_key = os.getenv("RAPIDAPI_KEY")
        if not api_key:
            print("RAPIDAPI_KEY environment variable is not set")
            raise HTTPException(status_code=500, detail="API key configuration error")
            
        headers = {
            "x-rapidapi-key": api_key,
            "x-rapidapi-host": "linkedin-api8.p.rapidapi.com"
        }
        querystring = {"url": linkedin_url}
        
        response = requests.get(url, headers=headers, params=querystring)
        
        if response.status_code != 200:
            print(f"RapidAPI LinkedIn error: Status {response.status_code}, Response: {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"LinkedIn scraping failed: {response.text}"
            )
        
        profile_data = response.json()
        raw_profile = str(profile_data)
        print(f"Successfully scraped profile data length: {len(raw_profile)}")
        
        if not profile_data:
            raise HTTPException(status_code=400, detail="LinkedIn scraping failed: Empty response")
        
        # Extract basic profile info from new API response format
        location = f"{profile_data.get('geo', {}).get('city', '')}, {profile_data.get('geo', {}).get('country', '')}"
        
        # Get current position
        positions = profile_data.get('position', [])
        current_position = positions[0] if positions else {}
        company = current_position.get('companyName', '')
        role = profile_data.get('headline', '')
        
        # Get profile picture and name
        photo_url = profile_data.get('profilePicture', '')
        name = profile_data.get('fullName', '')  # Extract name from LinkedIn data
        
        # Generate summary using Gemini
        prompt = f"""
You are an AI assistant that specializes in generating concise professional summaries for a knowledge database. You will be given raw JSON data containing a person's LinkedIn profile information. Your goal is to:

Parse the JSON carefully to extract the most relevant details (e.g., name, education, positions, key accomplishments, honors).
Produce a single-paragraph summary that is succinct, factual, and professional.
Avoid including personal contact details, links, or any extraneous information (e.g., email addresses).
Focus on the individual’s academic background, professional experience, notable projects, and honors.
Write in the third person, using a neutral, professional tone.
Ensure the paragraph is 300 words.
Do not output anything other than this single-paragraph summary. Do not format the text with markdown. If data is missing or not relevant, simply omit it. If there is no data at all, return an empty string.

Here is the raw JSON (do not summarize this instruction text, only the JSON content below):
        {raw_profile}
        """
        
        print("Generating summary with Gemini...")
        response = model.generate_content(prompt)
        summary = response.text
        
        # Generate a unique ID for this data
        data_id = str(uuid.uuid4())
        
        # Store the full data with timestamp
        linkedin_data_store[data_id] = {
            'data': profile_data,
            'timestamp': datetime.now(),
            'location': location,
            'company': company,
            'role': role,
            'summary': summary,
            'photoUrl': photo_url,
            'name': name
        }
        
        # Clean up old data
        cleanup_old_data()
        
        # Return only essential data and the ID
        return {
            "location": location,
            "company": company,
            "role": role,
            "summary": summary,
            "photoUrl": photo_url,
            "name": name,
            "dataId": data_id  # Frontend can use this to fetch raw data later
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in scrape_linkedin_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to scrape LinkedIn profile: {str(e)}")

@router.get("/linkedin-data/{data_id}")
async def get_linkedin_data(data_id: str):
    cleanup_old_data()
    stored_data = linkedin_data_store.get(data_id)
    if not stored_data:
        raise HTTPException(status_code=404, detail="LinkedIn data not found or expired")
    return stored_data['data']  # Return the raw LinkedIn data

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
        print(f"Raw request data: {user_data}")
        
        # Check if we have all required fields
        required_fields = ["email", "name", "location", "linkedinUrl", "company", "role", "summary"]
        for field in required_fields:
            print(f"Checking field '{field}': {field in user_data}")
            if field in user_data:
                print(f"Value: {user_data[field]}")
        
        # Create user model instance
        print("\nCreating User model instance...")
        user_model = User(db)
        
        # Check if user exists
        print(f"\nChecking for existing user with LinkedIn URL: {user_data.get('linkedinUrl')}")
        existing_user = await user_model.get_user_by_linkedin_url(user_data.get("linkedinUrl"))
        if existing_user:
            print(f"Found existing user: {existing_user}")
            raise HTTPException(status_code=400, detail="User with this LinkedIn URL already exists")
        
        print("\nGenerating embedding...")
        try:
            # Check if VoyageAI key is set
            if not voyageai.api_key:
                print("VoyageAI API key is not set!")
                raise ValueError("VoyageAI API key is not configured")
                
            # Generate embedding for the summary using voyage-3 model
            print(f"Summary text length: {len(user_data.get('summary', ''))}")
            print(f"Summary text: {user_data.get('summary', '')[:100]}...")  # Print first 100 chars
            
            embedding = voyageai.get_embedding(
                user_data["summary"],
                model="voyage-3-large"
            )
            print(f"Generated embedding length: {len(embedding)}")
            
        except Exception as e:
            print(f"Error generating embedding: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Embedding error traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")
        
        print("\nCreating user in database...")
        try:
            # Log raw data size
            raw_data = user_data.get("raw_data", {})
            print(f"Raw LinkedIn data size: {len(str(raw_data))} characters")
            print(f"Raw data keys: {raw_data.keys() if isinstance(raw_data, dict) else 'Not a dictionary'}")
            
            # Create user in database
            user_id = await user_model.create_user(
                user_data=user_data,
                raw_linkedin_data=raw_data,
                embedding=embedding
            )
            print(f"Successfully created user with ID: {user_id}")
            return {"userId": user_id}
            
        except Exception as e:
            print(f"Database error: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Database error traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Failed to create user in database: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in complete_signup: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error during signup: {str(e)}")
