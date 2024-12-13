from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable is not set")

async def connect_to_db():
    try:
        # Create a client instance
        client = AsyncIOMotorClient(MONGODB_URI)
        # Get the database
        db = client.get_database("profilematch")  # Replace with your actual database name
        # Test the connection
        await client.admin.command('ping')
        print("Successfully connected to MongoDB")
        return client, db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise

async def get_db():
    try:
        client, db = await connect_to_db()
        yield db
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")
