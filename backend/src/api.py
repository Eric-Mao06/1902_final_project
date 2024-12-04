from fastapi import FastAPI, HTTPException
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

@app.get("/api/search")
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

@app.post("/api/generate-text")
async def generate_text(request: TextGenerationRequest):
    return await generate_text_handler(request)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
