from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = MongoClient(os.getenv("MONGODB_URI"))
db = client.get_database("linkd")
profiles_collection = db.profiles

@app.get("/api/search")
async def search_profiles(query: str):
    try:
        # Simple text search in MongoDB
        results = profiles_collection.find(
            {"$text": {"$search": query}},
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})]).limit(10)
        
        # Convert MongoDB cursor to list and clean up _id
        profiles = []
        for profile in results:
            profile['_id'] = str(profile['_id'])  # Convert ObjectId to string
            profiles.append(profile)
        
        return {"results": profiles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
