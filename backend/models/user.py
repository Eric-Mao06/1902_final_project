from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Optional, Dict, Any, List
from datetime import datetime

class User:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db.users

    async def create_user(self, user_data: Dict[str, Any], raw_linkedin_data: Dict[str, Any], embedding: List[float]) -> str:
        try:
            # Validate required fields
            required_fields = {
                "email": str,
                "name": str,
                "location": str,
                "linkedinUrl": str,
                "company": str,
                "role": str,
                "summary": str
            }
            
            for field, field_type in required_fields.items():
                if field not in user_data:
                    raise ValueError(f"Missing required field: {field}")
                if not isinstance(user_data[field], field_type):
                    raise ValueError(f"Invalid type for {field}. Expected {field_type.__name__}, got {type(user_data[field]).__name__}")
            
            # Validate embedding
            if not isinstance(embedding, list) or not all(isinstance(x, float) for x in embedding):
                raise ValueError("Invalid embedding format. Expected list of floats.")
            
            # Log raw LinkedIn data
            print(f"\nRaw LinkedIn data type: {type(raw_linkedin_data)}")
            print(f"Raw LinkedIn data keys: {raw_linkedin_data.keys() if isinstance(raw_linkedin_data, dict) else 'Not a dictionary'}")
            
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
            
            print(f"\nCreating user document with fields:")
            for key, value in user_doc.items():
                if key != "summary_embedding":  # Skip printing the embedding
                    print(f"{key}: {'<large_data>' if key == 'raw_linkedin_data' else value}")
            
            result = await self.collection.insert_one(user_doc)
            print(f"\nSuccessfully inserted document with ID: {result.inserted_id}")
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error in create_user: {str(e)}")
            raise ValueError(f"Failed to create user: {str(e)}")

    async def get_user_by_linkedin_url(self, linkedin_url: str) -> Optional[Dict[str, Any]]:
        user = await self.collection.find_one({"linkedinUrl": linkedin_url})
        if user:
            user["_id"] = str(user["_id"])  # Convert ObjectId to string
        return user

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        user = await self.collection.find_one({"email": email})
        if user:
            user["_id"] = str(user["_id"])  # Convert ObjectId to string
        return user

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            user = await self.collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user["_id"] = str(user["_id"])  # Convert ObjectId to string
            return user
        except:
            return None

    async def update_user(self, email: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            # Remove email and linkedinUrl from update data if present
            update_data.pop("email", None)
            update_data.pop("linkedinUrl", None)
            
            # Add updated_at timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            # Perform the update
            result = await self.collection.update_one(
                {"email": email},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                return None
                
            # Fetch and return the updated user
            updated_user = await self.get_user_by_email(email)
            return updated_user
        except Exception as e:
            print(f"Error updating user: {e}")
            raise

    async def search_users_by_embedding(self, query_embedding: List[float], limit: int = 6) -> List[Dict[str, Any]]:
        """
        Search for users using vector similarity search with the provided query embedding
        """
        try:
            # Perform vector similarity search using dot product
            pipeline = [
                {
                    "$addFields": {
                        "similarity": {
                            "$reduce": {
                                "input": {"$range": [0, {"$size": "$summary_embedding"}]},
                                "initialValue": 0,
                                "in": {
                                    "$add": [
                                        "$$value",
                                        {
                                            "$multiply": [
                                                {"$arrayElemAt": ["$summary_embedding", "$$this"]},
                                                {"$arrayElemAt": [query_embedding, "$$this"]}
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                {"$sort": {"similarity": -1}},
                {"$limit": limit},
                {
                    "$project": {
                        "_id": {"$toString": "$_id"},
                        "name": 1,
                        "email": 1,
                        "location": 1,
                        "company": 1,
                        "role": 1,
                        "summary": 1,
                        "photoUrl": 1,
                        "linkedinUrl": 1,
                        "similarity": 1
                    }
                }
            ]
            
            cursor = self.collection.aggregate(pipeline)
            results = await cursor.to_list(length=limit)
            return results
        except Exception as e:
            print(f"Error in search: {e}")
            raise

    async def delete_user(self, email: str) -> bool:
        result = await self.collection.delete_one({"email": email})
        return result.deleted_count > 0
