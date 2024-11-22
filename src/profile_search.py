import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
import requests
from typing import List, Dict, Any

class ProfileSearch:
    def __init__(self):
        load_dotenv()
        self.mongo_client = MongoClient(os.getenv('MONGODB_URI'))
        self.db = self.mongo_client['alumni']
        self.collection: Collection = self.db['profiles']
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
                [("embedding", 1)],
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

    def search_profiles(self, query: str, limit: int = 5) -> List[Dict[Any, Any]]:
        """Search for profiles using semantic search"""
        query_embedding = self.generate_embedding(query)
        
        results = self.collection.aggregate([
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_embedding,
                    "numCandidates": limit * 10,
                    "limit": limit
                }
            },
            {
                "$project": {
                    "embedding": 0,  
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ])
        
        return list(results)

if __name__ == "__main__":
    searcher = ProfileSearch()
    query = input("Enter your search query: ")
    results = searcher.search_profiles(query)
    
    print("\nSearch Results:")
    for result in results:
        score = result.pop('score', 0) 
        print(f"\nScore: {score:.4f}")
        for key, value in result.items():
            print(f"{key}: {value}")
