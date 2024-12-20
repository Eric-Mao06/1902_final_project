from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from fastapi import HTTPException
from contextlib import asynccontextmanager

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable is not set")

# Create a global client instance
client = AsyncIOMotorClient(MONGODB_URI)
db = client.get_database("profilematch")

async def get_db():
    try:
        # Test the connection
        await client.admin.command('ping')
        return db
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")
