from fastapi import APIRouter, Request, Response, HTTPException, status
from fastapi.responses import JSONResponse, RedirectResponse
from google.oauth2 import id_token
from google.auth.transport import requests
import os
from datetime import datetime
from typing import Optional
from pymongo import MongoClient

router = APIRouter()

# MongoDB setup
client = MongoClient(os.getenv('MONGODB_URI'))
db = client.get_database('linkd')
users_collection = db.users

# Google OAuth2 credentials
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

@router.post("/auth/google")
async def google_auth(request: Request):
    try:
        # Get the token from the request body
        data = await request.json()
        token = data.get('token')
        print("Received token:", token)
        
        if not token:
            raise HTTPException(status_code=400, detail="Token is required")

        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token, requests.Request(), GOOGLE_CLIENT_ID)

        # Get user info from the token
        user_email = idinfo['email']
        user_name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        print("User info from Google:", {"email": user_email, "name": user_name})
        
        # Check if user exists in database
        user = users_collection.find_one({"email": user_email})
        print("Existing user:", user)
        
        if not user:
            # Create new user if doesn't exist
            user = {
                "email": user_email,
                "name": user_name,
                "picture": picture,
                "linkedin_url": None,  # Will be updated later
                "created_at": datetime.utcnow(),
                "last_login": datetime.utcnow()
            }
            users_collection.insert_one(user)
            print("Created new user:", user)
        else:
            # Update last login time
            users_collection.update_one(
                {"email": user_email},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            print("Updated existing user")

        # Set session cookie
        response = JSONResponse(content={
            "email": user_email,
            "name": user_name,
            "picture": picture,
            "linkedin_url": user.get("linkedin_url") if user else None
        })
        
        print("Setting session cookie for:", user_email)
        response.set_cookie(
            key="session",
            value=user_email,  # Using email as session identifier
            httponly=True,
            secure=False,  # Set to False for development
            samesite='lax',
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        return response

    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=400, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="session")
    return {"message": "Logged out successfully"}

@router.get("/auth/user")
async def get_current_user(request: Request):
    session = request.cookies.get("session")
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    user = users_collection.find_one({"email": session})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Convert ObjectId to string for JSON serialization
    user["_id"] = str(user["_id"])
    return user

@router.get("/auth/session")
async def check_session(request: Request):
    print("Checking session...")
    session = request.cookies.get("session")
    print("Session cookie:", session)
    print("All cookies:", request.cookies)
    
    if not session:
        print("No session cookie found")
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Not authenticated"}
        )
    
    user = users_collection.find_one({"email": session})
    print("Found user:", user)
    
    # Convert ObjectId to string for JSON serialization
    user["_id"] = str(user["_id"])
    return user

@router.put("/auth/update-linkedin")
async def update_linkedin_url(request: Request):
    try:
        session = request.cookies.get("session")
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        data = await request.json()
        linkedin_url = data.get('linkedin_url')
        
        if not linkedin_url:
            raise HTTPException(
                status_code=400,
                detail="LinkedIn URL is required"
            )
        
        result = users_collection.update_one(
            {"email": session},
            {"$set": {"linkedin_url": linkedin_url}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        return {"message": "LinkedIn URL updated successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
