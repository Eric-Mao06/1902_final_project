from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from .profile_search import ProfileSearch
from typing import List, Dict, Any
from fastapi.responses import JSONResponse
import traceback
import logging
from bson.json_util import dumps
import json
from datetime import datetime
from pymongo import MongoClient
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB setup
client = MongoClient(os.getenv('MONGODB_URI'))
db = client.get_database('users')
users_collection = db.profiles

# Create indexes if they don't exist
users_collection.create_index("email", unique=True)
users_collection.create_index("google_id", unique=True)

app = FastAPI()

origins = [
    "http://localhost:8081",  # Expo development server
    "http://localhost:19006", # Expo web development server
    "http://localhost:3000",  # Next.js development server
    "exp://localhost:8081",    # Expo Go app
    "http://localhost:8000",
    "http://127.0.0.1:8081",  # Alternative localhost notation
    "exp://localhost:19000",   # Expo development client
    "exp://localhost:8081", 
    "http://localhost:19000",
    "https://upenn.netlify.app",  # Production Netlify domain
    "https://upenn.netlify.app/",  # Production Netlify domain with trailing slash
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Add OPTIONS for preflight requests
    allow_headers=["*"],
)

# Initialize ProfileSearch
profile_searcher = ProfileSearch()

@app.post("/auth/google")
async def google_auth(request: Request):
    try:
        # Get user data from request body
        data = await request.json()
        logger.info(f"Received Google auth data: {data}")

        # Extract token and user information
        token = data.get('token')
        if not token:
            raise HTTPException(status_code=400, detail="Token is required")

        # Extract user information
        email = data.get('email')
        name = data.get('name')
        google_id = data.get('sub')

        if not email or not name or not google_id:
            raise HTTPException(status_code=400, detail="Email, name, and Google ID are required")

        # Check if user exists in database
        existing_user = users_collection.find_one({"email": email})
        
        if existing_user:
            # Update last login time
            users_collection.update_one(
                {"email": email},
                {
                    "$set": {
                        "last_login": datetime.utcnow(),
                        "name": name,
                        "google_id": google_id
                    }
                }
            )
            user = users_collection.find_one({"email": email})
        else:
            # Create new user
            new_user = {
                "email": email,
                "name": name,
                "google_id": google_id,
                "linkedin_url": None,
                "created_at": datetime.utcnow(),
                "last_login": datetime.utcnow()
            }
            users_collection.insert_one(new_user)
            user = new_user

        # Convert ObjectId to string for JSON serialization
        user_response = json.loads(dumps(user))
        return JSONResponse(content=user_response)

    except Exception as e:
        logger.error(f"Error in google_auth: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-linkedin")
async def update_linkedin(request: Request):
    try:
        data = await request.json()
        email = data.get('email')
        linkedin_url = data.get('linkedin_url')

        if not email or not linkedin_url:
            raise HTTPException(status_code=400, detail="Email and LinkedIn URL are required")

        # Update user's LinkedIn URL
        result = users_collection.update_one(
            {"email": email},
            {"$set": {"linkedin_url": linkedin_url}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        # Get updated user data
        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Convert ObjectId to string for JSON serialization
        user_response = json.loads(dumps(user))
        return JSONResponse(content=user_response)

    except Exception as e:
        logger.error(f"Error updating LinkedIn URL: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
async def search_profiles(query: str, limit: int = 50):
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
        
        response = JSONResponse(content=json_results)
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        return response
        
    except Exception as e:
        logger.error(f"Error in search_profiles: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok"}
