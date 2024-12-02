from pymongo import MongoClient
from bson import ObjectId
from typing import Optional, Dict, Any
from datetime import datetime

class User:
    def __init__(self, db: MongoClient):
        self.collection = db.users

    async def create_user(self, user_data: Dict[str, Any], raw_linkedin_data: Dict[str, Any], embedding: list) -> str:
        user_doc = {
            "email": user_data["email"],
            "name": user_data["name"],
            "location": user_data["location"],
            "linkedinUrl": user_data["linkedinUrl"],
            "company": user_data["company"],
            "role": user_data["role"],
            "summary": user_data["summary"],
            "photoUrl": user_data.get("photoUrl", ""),
            "summary_embedding": embedding,
            "raw_linkedin_data": raw_linkedin_data,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await self.collection.insert_one(user_doc)
        return str(result.inserted_id)

    async def get_user_by_linkedin_url(self, linkedin_url: str) -> Optional[Dict[str, Any]]:
        user = await self.collection.find_one({"linkedinUrl": linkedin_url})
        return user if user else None

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        user = await self.collection.find_one({"email": email})
        return user if user else None

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        user = await self.collection.find_one({"_id": ObjectId(user_id)})
        return user if user else None
