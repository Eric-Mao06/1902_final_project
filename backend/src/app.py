from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from .profile_search import ProfileSearch
from .text_generation import TextGenerationRequest, generate_text_stream

app = FastAPI()
profile_search = ProfileSearch()

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8081",  # Expo web default port
    "http://127.0.0.1:8081",  # Alternative localhost notation
    "exp://localhost:19000",   # Expo development client
    "http://localhost:19000",
    "https://upenn.netlify.app",  # Production Netlify domain
    "https://upenn.netlify.app/",  # Production Netlify domain with trailing slash
    "https://protective-quietude-production.up.railway.app",  # Production frontend domain
    "https://protective-quietude-production.up.railway.app/",  # Production frontend domain with trailing slash
    "https://1902finalproject-production.up.railway.app",  # Backend domain
    "https://1902finalproject-production.up.railway.app/",  # Backend domain with trailing slash
]

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
