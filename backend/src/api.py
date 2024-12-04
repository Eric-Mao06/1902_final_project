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
