import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
import requests
from typing import List, Dict, Any
from bson import ObjectId
import numpy as np
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

class ProfileSearch:
    def __init__(self):
        load_dotenv()
        self.mongo_client = MongoClient(os.getenv('MONGODB_URI'))
        self.db = self.mongo_client['profilematch']
        self.collection: Collection = self.db['users']
        self.voyage_api_key = os.getenv('VOYAGE_API_KEY')
        self.voyage_api_url = "https://api.voyageai.com/v1/embeddings"
        self._ensure_vector_search_index()
    
    def _ensure_vector_search_index(self):
        """Create vector search index if it doesn't exist"""
        index_name = "vector_index"
        existing_indexes = self.collection.list_indexes()
        
        index_exists = any(index.get('name') == index_name for index in existing_indexes)
        
        if not index_exists:
            self.collection.create_index(
                [("summary_embedding", 1)],
                name=index_name
            )

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for the given text using Voyage AI API"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.voyage_api_key}"
        }
        
        response = requests.post(
            self.voyage_api_url,
            headers=headers,
            json={"input": text, "model": "voyage-3"}
        )
        
        if response.status_code == 200:
            return response.json()["data"][0]["embedding"]
        else:
            raise Exception(f"Error generating embedding: {response.text}")

    def search_profiles(self, query: str, limit: int = 6) -> List[Dict[Any, Any]]:
        """Search for profiles using semantic search with cosine similarity"""
        query_embedding = self.generate_embedding(query)
        query_embedding_np = np.array(query_embedding)
        
        # Get all profiles with embeddings
        profiles = list(self.collection.find({"summary_embedding": {"$exists": True}}))
        logger.debug(f"Found {len(profiles)} profiles with embeddings")
        
        # Calculate cosine similarity for each profile
        results_with_scores = []
        for profile in profiles:
            if "summary_embedding" in profile:
                try:
                    profile_embedding = np.array(profile["summary_embedding"])
                    # Calculate cosine similarity
                    similarity = np.dot(query_embedding_np, profile_embedding) / (
                        np.linalg.norm(query_embedding_np) * np.linalg.norm(profile_embedding)
                    )
                    profile_copy = profile.copy()
                    profile_copy["score"] = float(similarity)
                    del profile_copy["summary_embedding"]  # Remove embedding from results
                    results_with_scores.append(profile_copy)
                except Exception as e:
                    logger.error(f"Error processing profile {profile.get('_id')}: {str(e)}")
        
        logger.debug(f"Processed {len(results_with_scores)} profiles with similarity scores")
        
        # Sort by similarity score and get top results
        results_with_scores.sort(key=lambda x: x["score"], reverse=True)
        top_results = results_with_scores[:limit]
        
        logger.debug(f"Returning top {len(top_results)} results")
        
        return [serialize_mongo_doc(doc) for doc in top_results]
