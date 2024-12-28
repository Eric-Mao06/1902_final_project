import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = str(Path(__file__).parent)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from fastapi import FastAPI, HTTPException, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from src.profile_search import ProfileSearch
from src.text_generation import TextGenerationRequest, create_prompt
from routes import auth, users, search, elo, leaderboard
from bson.json_util import dumps
import traceback
import logging
import os
from dotenv import load_dotenv
from google import generativeai
from starlette.middleware.base import BaseHTTPMiddleware

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

class CustomHeaderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Modify the headers to increase size limits
        request.scope["headers"].append(
            (b"large-allocation", b"true")
        )
        response = await call_next(request)
        response.headers["Content-Security-Policy"] = "frame-ancestors 'self'"
        return response

class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        # Only enforce HTTPS on Railway (production)
        if os.getenv('RAILWAY_ENVIRONMENT_NAME') and response.status_code == 307:
            location = response.headers.get('location', '')
            if location.startswith('http://'):
                response.headers['location'] = location.replace('http://', 'https://', 1)
        return response

app = FastAPI()

# Initialize services
profile_search = ProfileSearch()

# Initialize Gemini if API key exists
if os.getenv("GEMINI_API_KEY"):
    generativeai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "exp://localhost:19000",
    "http://localhost:19000",
    "https://upenn.netlify.app",
    "https://protective-quietude-production.up.railway.app",
    "https://protective-quietude-production.up.railway.app/",
    "https://1902finalproject-production.up.railway.app",
    "https://1902finalproject-production.up.railway.app/",
    "https://pennlinkd.com/",
    "https://pennlinkd.com",
]

# Add HTTPS redirect middleware first
app.add_middleware(HTTPSRedirectMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization"],
)

# Add custom header middleware
app.add_middleware(CustomHeaderMiddleware)

# Include routers with prefixes
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(elo.router, prefix="/api/elo", tags=["elo"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["leaderboard"])

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/generate")
async def generate_text(request: TextGenerationRequest):
    try:
        if not os.getenv("GEMINI_API_KEY"):
            raise HTTPException(status_code=500, detail="Gemini API key not configured")

        # Get the prompt from text_generation.py
        prompt = create_prompt(request)
        
        # Use Gemini to generate the response
        model = generativeai.GenerativeModel('gemini-1.5-flash-8b')
        response = await model.generate_content_async(prompt)
        text = response.text

        # Stream the response in chunks
        async def generate():
            chunk_size = 100
            for i in range(0, len(text), chunk_size):
                chunk = text[i:i + chunk_size]
                yield chunk.encode('utf-8')

        return StreamingResponse(
            generate(),
            media_type='text/event-stream'
        )
    except Exception as e:
        logger.error(f"Error in generate_text: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
