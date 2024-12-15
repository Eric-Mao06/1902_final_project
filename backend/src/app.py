from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from .profile_search import ProfileSearch
from .text_generation import TextGenerationRequest, generate_text_stream

app = FastAPI()
profile_search = ProfileSearch()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
