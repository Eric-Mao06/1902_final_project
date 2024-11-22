import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
import requests
from typing import List, Dict, Any

class VectorSearch:
    def __init__(self, collection_name: str, database_name: str = "vector_search_db"):
        load_dotenv()
        self.mongo_client = MongoClient(os.getenv('MONGODB_URI'))
        self.db = self.mongo_client[database_name]
        self.collection: Collection = self.db[collection_name]
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
        """Generate embedding using Voyage AI API"""
        headers = {
            "Authorization": f"Bearer {self.voyage_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "voyage-01",
            "input": text
        }
        
        response = requests.post(self.voyage_api_url, headers=headers, json=data)
        response.raise_for_status()
        
        return response.json()['data'][0]['embedding']
    
    def add_document(self, text: str, metadata: Dict[str, Any] = None) -> str:
        """Add a document with its embedding to MongoDB"""
        embedding = self.generate_embedding(text)
        
        document = {
            "text": text,
            "embedding": embedding,
            **(metadata or {})
        }
        
        result = self.collection.insert_one(document)
        return str(result.inserted_id)
    
    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Perform vector similarity search"""
        query_embedding = self.generate_embedding(query)
        
        pipeline = [
            {
                "$addFields": {
                    "similarity": {
                        "$reduce": {
                            "input": {"$range": [0, {"$size": "$embedding"}]},
                            "initialValue": 0,
                            "in": {
                                "$add": [
                                    "$$value",
                                    {
                                        "$multiply": [
                                            {"$arrayElemAt": ["$embedding", "$$this"]},
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
                    "text": 1,
                    "score": "$similarity",
                    "_id": 1
                }
            }
        ]
        
        results = list(self.collection.aggregate(pipeline))
        return results

if __name__ == "__main__":
    vector_search = VectorSearch("documents", "vector_search_db")
    
    vector_search.add_document(
        "The quick brown fox jumps over the lazy dog",
        {"category": "example"}
    )
    
    results = vector_search.search("fox jumping")
    for result in results:
        print(f"Text: {result['text']}")
        print(f"Score: {result['score']}")
        print("---")
