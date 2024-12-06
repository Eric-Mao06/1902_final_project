from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from .profile_search import ProfileSearch
from .text_generation import TextGenerationRequest, generate_text_handler
from typing import List, Dict, Any
from fastapi.responses import JSONResponse
import traceback
import logging
from bson.json_util import dumps
import json
import os
import requests
from google import generativeai

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8081",  # Expo web default port
    "http://127.0.0.1:8081",  # Alternative localhost notation
    "exp://localhost:19000",   # Expo development client
    "http://localhost:19000",
    "https://upenn.netlify.app",  # Production Netlify domain
    "https://upenn.netlify.app/",  # Production Netlify domain with trailing slash
    "https://protective-quietude-production.up.railway.app/",
    "https://1902finalproject-production.up.railway.app",  # Backend domain
    "https://1902finalproject-production.up.railway.app/",  # Backend domain with trailing slash
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize ProfileSearch
profile_searcher = ProfileSearch()

# Initialize Gemini
generativeai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = generativeai.GenerativeModel('gemini-pro')

@api_router.post("/linkedin-scrape")
async def scrape_linkedin_profile(data: Dict[str, str]):
    try:
        linkedin_url = data.get("linkedinUrl")
        if not linkedin_url:
            raise HTTPException(status_code=400, detail="LinkedIn URL is required")
        
        logger.debug(f"Attempting to scrape LinkedIn URL: {linkedin_url}")
        
        # Use scrapin.io API
        url = "https://api.scrapin.io/enrichment/profile"
        querystring = {
            "apikey": os.getenv("SCRAPIN_API_KEY"),
            "linkedInUrl": linkedin_url
        }
        
        logger.debug(f"Making request to scrapin.io with API key: {os.getenv('SCRAPIN_API_KEY')[:5]}...")
        logger.debug(f"Query parameters: {querystring}")
        response = requests.get(url, params=querystring)
        
        if response.status_code != 200:
            logger.error(f"Scrapin.io error: Status {response.status_code}, Response: {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"LinkedIn scraping failed: {response.text}"
            )
        
        profile_data = response.json()
        raw_profile = str(profile_data)
        logger.debug(f"Successfully scraped profile data length: {len(raw_profile)}")
        
        if not profile_data or "error" in profile_data:
            error_msg = profile_data.get("error", "Unknown error") if profile_data else "Empty response"
            raise HTTPException(status_code=400, detail=f"LinkedIn scraping failed: {error_msg}")
        
        # Generate summary using Gemini
        prompt = f"""
Analyze this LinkedIn profile comprehensively and extract detailed professional information. Generate rich semantic content that captures the person's complete professional identity. The summary should be around 400 words. Format it as one paragraph don't use markdown.
    
    Focus on extracting and synthesizing:
    
    PROFESSIONAL IDENTITY:
    - Career trajectory and progression
    - Industry specializations and domain expertise
    - Leadership and management experience
    - Professional achievements and impact
    - Core competencies and technical skills
    
    DOMAIN KNOWLEDGE:
    - Technical expertise and tools
    - Industry-specific knowledge
    - Methodologies and frameworks
    - Certifications and qualifications
    
    IMPACT & ACHIEVEMENTS:
    - Quantifiable results and metrics
    - Project outcomes and deliverables
    - Awards and recognition
    - Business value created
        Raw Profile Data:
        {raw_profile}
        """
        
        logger.debug("Generating summary with Gemini...")
        response = model.generate_content(prompt)
        summary = response.text
        
        # Extract basic profile info
        person = profile_data.get("person", {})
        logger.debug("Person data:", person)
        
        location = person.get("location", "")
        company = person.get("currentCompanyName", "")
        if not company and person.get("experience"):
            company = person["experience"][0].get("companyName", "")
        
        role = person.get("headline", "")
        if not role and person.get("experience"):
            role = person["experience"][0].get("title", "")

        # Get the person's name
        name = person.get("fullName", "")
        if not name:
            name = person.get("name", "")
        if not name:
            first_name = person.get("firstName", "")
            last_name = person.get("lastName", "")
            name = f"{first_name} {last_name}".strip()

        # Try different possible photo URL fields
        photo_url = person.get("photoUrl", "")
        if not photo_url:
            photo_url = person.get("profilePicture", "")
        if not photo_url:
            photo_url = person.get("profileImageUrl", "")
        if not photo_url:
            photo_url = person.get("imageUrl", "")
            
        logger.debug("Extracted photo URL:", photo_url)
        
        return {
            "location": location,
            "company": company,
            "role": role,
            "summary": summary,
            "photoUrl": photo_url,
            "raw_data": profile_data,
            "name": name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in scrape_linkedin_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to scrape LinkedIn profile: {str(e)}")

@api_router.get("/search")
async def search_profiles(query: str, limit: int = 6):
    try:
        logger.debug(f"Received search request with query: {query}, limit: {limit}")
        
        if not query:
            raise HTTPException(status_code=400, detail="Query parameter is required")
            
        results = profile_searcher.search_profiles(
            query=query,
            limit=limit
        )
        
        # Convert to JSON-safe format
        json_results = json.loads(dumps({"results": results}))
        logger.debug(f"Search results: {json_results}")
        
        return json_results
        
    except Exception as e:
        logger.error(f"Error in search_profiles: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/generate-text")
async def generate_text(request: TextGenerationRequest):
    return await generate_text_handler(request)

@api_router.get("/health")
async def health_check():
    return {"status": "ok"}

@api_router.get("/profile")
async def get_profile(email: str):
    try:
        logger.debug(f"Getting profile for email: {email}")
        
        result = profile_searcher.get_profile_by_email(email=email)
        if not result:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Convert to JSON-safe format
        json_result = json.loads(dumps({"profile": result}))
        logger.debug(f"Get profile result: {json_result}")
        
        return json_result
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in get_profile: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/profile/{profile_id}")
async def edit_profile(profile_id: str, profile_data: Dict[str, Any]):
    try:
        logger.debug(f"Editing profile {profile_id} with data: {profile_data}")
        
        # Handle the "new" profile case
        actual_profile_id = None if profile_id == "new" else profile_id
        
        result = profile_searcher.edit_profile(
            profile_id=actual_profile_id,
            profile_data=profile_data
        )
        
        # Convert to JSON-safe format
        json_result = json.loads(dumps({"profile": result}))
        logger.debug(f"Edit result: {json_result}")
        
        return json_result
        
    except Exception as e:
        logger.error(f"Error in edit_profile: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Include the router
app.include_router(api_router)
