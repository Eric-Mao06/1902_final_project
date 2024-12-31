import os
from typing import List, Dict, Any
from dotenv import load_dotenv
from pymongo.collection import Collection
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

class LeaderboardSystem:
    def __init__(self, db=None):
        self.db = db
        load_dotenv()
        mongodb_uri = os.getenv('MONGODB_URI')
        self.mongo_client = AsyncIOMotorClient(mongodb_uri)
        self.db = self.mongo_client['UPenn']
        
        # Collections
        self.profile_collection = self.db['profilematch']
        self.ratings_collection = self.db['elo']

    async def get_leaderboard(self, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        try:
            # First, get the ratings data
            ratings_data = await self.ratings_collection.find({}) \
                .sort("rating", -1) \
                .limit(limit) \
                .skip(skip) \
                .to_list(length=limit)

            # Get the user IDs to fetch profiles for
            user_ids = [entry["_id"] for entry in ratings_data]

            # Fetch the corresponding profiles
            profiles = {
                doc["_id"]: doc 
                for doc in await self.profile_collection.find(
                    {"_id": {"$in": user_ids}}
                ).to_list(length=None)
            }

            # Combine the data
            leaderboard = []
            for rating_entry in ratings_data:
                user_id = rating_entry["_id"]
                if user_id in profiles:
                    profile = profiles[user_id]
                    leaderboard.append({
                        "_id": str(user_id),
                        "rating": rating_entry["rating"],
                        "name": profile.get("name"),
                        "role": profile.get("role"),
                        "photoUrl": profile.get("photoUrl"),
                        "linkedinUrl": profile.get("linkedinUrl")
                    })

            return leaderboard
        except Exception as e:
            print(f"Error getting leaderboard: {str(e)}")
            raise