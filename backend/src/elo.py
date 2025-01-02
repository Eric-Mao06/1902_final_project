import os
from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Any, Tuple
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def serialize_mongo_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        else:
            result[key] = value
    return result

class EloSystem:
    def __init__(self):
        """Initialize EloSystem with MongoDB connection"""
        load_dotenv()
        mongodb_uri = os.getenv('MONGODB_URI')
        self.mongo_client = AsyncIOMotorClient(mongodb_uri)
        
        # Connect to both databases
        self.profile_db = self.mongo_client['profilematch']
        self.ratings_db = self.mongo_client['elo']
        
        # Collections
        self.profile_collection = self.profile_db['users']
        self.ratings_collection = self.ratings_db['users']
        print(self.ratings_collection)

    async def get_random_pair(self) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        try:
            # Get random profiles from profile database with email field
            profiles = await self.profile_collection.aggregate([
                # Match documents that have an email field in raw_linkedin_data
                {"$match": {
                    "email": {"$exists": True, "$ne": ""}
                }},
                {"$sample": {"size": 2}}
            ]).to_list(length=2)

            # If we don't get enough profiles with email
            if len(profiles) < 2:
                raise Exception("Not enough profiles with email found for comparison")

            enhanced_profiles = []  # Create a new list for the enhanced profiles
            
            # Enhance profiles with their Elo ratings
            for i in range(2):
                # Serialize the profile document
                profile = serialize_mongo_doc(profiles[i])
                profile_id = profile["_id"]
                
                # Look up existing rating
                rating_doc = await self.ratings_collection.find_one({"_id": ObjectId(profile_id)})
                
                # Create rating document if it doesn't exist
                if not rating_doc:
                    rating_doc = {
                        "_id": ObjectId(profile_id),
                        "rating": 800
                    }
                    await self.ratings_collection.insert_one(rating_doc)
                else:
                    rating_doc = serialize_mongo_doc(rating_doc)
                
                profile["elo"] = rating_doc["rating"]
                enhanced_profiles.append(profile)

            return enhanced_profiles[0], enhanced_profiles[1]

        except Exception as e:
            logger.error(f"Error getting random pair: {str(e)}")
            raise

    def calculate_elo_change(self, rating_a: int, rating_b: int, result: float, k_factor: int = 32) -> Tuple[int, int]:
        """
        Calculate new Elo ratings for two players
        result: 1 for A wins, 0 for B wins, 0.5 for draw
        """
        # Calculate expected scores
        expected_a = 1 / (1 + 10 ** ((rating_b - rating_a) / 400))
        expected_b = 1 / (1 + 10 ** ((rating_a - rating_b) / 400))
        
        # Calculate new ratings
        new_rating_a = round(rating_a + k_factor * (result - expected_a))
        new_rating_b = round(rating_b + k_factor * ((1 - result) - expected_b))
        
        return new_rating_a, new_rating_b

    async def vote(self, profile_id_a: str, profile_id_b: str, result: str) -> Tuple[int, int, Tuple[int, int]]:
        """
        Update Elo ratings based on vote
        result: "left" (profile_a wins), "right" (profile_b wins), or "equal" (draw)
        Returns: (new_rating_a, new_rating_b, (change_a, change_b))
        """
        try:
            # Convert result to numerical value
            result_value = {
                "left": 1.0,    # Profile A wins
                "right": 0.0,   # Profile B wins
                "equal": 0.5    # Draw
            }[result]

            # Get current ratings
            rating_a_doc = await self.ratings_collection.find_one({"_id": ObjectId(profile_id_a)})
            rating_b_doc = await self.ratings_collection.find_one({"_id": ObjectId(profile_id_b)})

            # Use default rating if not found
            rating_a = rating_a_doc["rating"] if rating_a_doc else 800
            rating_b = rating_b_doc["rating"] if rating_b_doc else 800

            # Calculate new ratings
            new_rating_a, new_rating_b = self.calculate_elo_change(rating_a, rating_b, result_value)

            # Calculate changes
            change_a = new_rating_a - rating_a
            change_b = new_rating_b - rating_b

            # Update ratings in database
            await self.ratings_collection.update_one(
                {"_id": ObjectId(profile_id_a)},
                {"$set": {"rating": new_rating_a}},
                upsert=True
            )
            await self.ratings_collection.update_one(
                {"_id": ObjectId(profile_id_b)},
                {"$set": {"rating": new_rating_b}},
                upsert=True
            )

            return new_rating_a, new_rating_b, (change_a, change_b)

        except Exception as e:
            logger.error(f"Error updating Elo ratings: {str(e)}")
            raise