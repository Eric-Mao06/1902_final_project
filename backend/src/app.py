from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from .profile_search import ProfileSearch
from .text_generation import TextGenerationRequest, generate_text_stream

app = FastAPI()
profile_search = ProfileSearch()

# Configure CORS
def normalize_url(url: str) -> str:
    """Remove trailing slash from URL if it exists"""
    return url.rstrip('/')

origins = [normalize_url(origin) for origin in [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8081",  # Expo web default port
    "http://127.0.0.1:8081",  # Alternative localhost notation
    "exp://localhost:19000",   # Expo development client
    "http://localhost:19000",
    "https://upenn.netlify.app",  # Production Netlify domain
    "https://protective-quietude-production.up.railway.app",  # Production frontend domain
    "https://protective-quietude-production.up.railway.app/",  # Production frontend domain
    "https://1902finalproject-production.up.railway.app",  # Backend domain
    "https://1902finalproject-production.up.railway.app/",  # Backend domain
]]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/api/search")
async def search(query: str):
    results = profile_search.search_profiles(query)
    return {"results": results}

@app.get("/api/profile")
async def get_profile(email: str):
    try:
        profile = profile_search.get_profile_by_email(email)
        if profile:
            return {"profile": profile}
        else:
            raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-text")
async def generate_text(request_data: TextGenerationRequest):
    print(f"Received generate-text request: {request_data}")
    try:
        return StreamingResponse(
            generate_text_stream(request_data),
            media_type='text/plain',
        )
    except Exception as e:
        print(f"Error in generate_text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Print all registered routes on startup
@app.on_event("startup")
async def startup_event():
    print("\nRegistered routes:")
    for route in app.routes:
        try:
            route_info = str(route)
            print(f"{route_info}")
        except Exception as e:
            print(f"[Unknown route type] {route}")
