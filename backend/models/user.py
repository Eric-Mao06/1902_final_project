from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

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
            logger.info(f"Created user with ID: {result.inserted_id}")
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error in create_user: {str(e)}")
            raise

    async def get_user_by_linkedin_url(self, linkedin_url: str) -> Optional[Dict[str, Any]]:
        try:
            user = await self.collection.find_one({"linkedinUrl": linkedin_url})
            if user:
                user["_id"] = str(user["_id"])
            return user
        except Exception as e:
            logger.error(f"Error in get_user_by_linkedin_url: {str(e)}")
            raise

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        try:
            user = await self.collection.find_one({"email": email})
            if user:
                user["_id"] = str(user["_id"])
            return user
        except Exception as e:
            logger.error(f"Error in get_user_by_email: {str(e)}")
            raise

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            user = await self.collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user["_id"] = str(user["_id"])
            return user
        except Exception as e:
            logger.error(f"Error in get_user_by_id: {str(e)}")
            raise

    async def update_user(self, email: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            logger.debug(f"Updating user {email} with data: {update_data}")
            
            # Remove fields that shouldn't be updated
            update_data.pop("email", None)
            update_data.pop("_id", None)  # Remove _id field as it's immutable
            update_data["updated_at"] = datetime.utcnow()
            
            # Perform the update
            result = await self.collection.find_one_and_update(
                {"email": email},
                {"$set": update_data},
                return_document=True
            )
            
            if result:
                result["_id"] = str(result["_id"])
                logger.info(f"Successfully updated user {email}")
            else:
                logger.warning(f"No user found to update with email {email}")
                
            return result
        except Exception as e:
            logger.error(f"Error in update_user: {str(e)}")
            raise

    async def search_users_by_embedding(self, query_embedding: List[float], limit: int = 6) -> List[Dict[str, Any]]:
        try:
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
                {"$limit": limit}
            ]
            
            results = []
            async for doc in self.collection.aggregate(pipeline):
                doc["_id"] = str(doc["_id"])
                results.append(doc)
            
            return results
        except Exception as e:
            logger.error(f"Error in search_users_by_embedding: {str(e)}")
            raise

    async def delete_user(self, email: str) -> bool:
        try:
            result = await self.collection.delete_one({"email": email})
            success = result.deleted_count > 0
            if success:
                logger.info(f"Successfully deleted user {email}")
            else:
                logger.warning(f"No user found to delete with email {email}")
            return success
        except Exception as e:
            logger.error(f"Error in delete_user: {str(e)}")
            raise
