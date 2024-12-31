from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get MongoDB URI from environment variable
MONGODB_URI = os.getenv('MONGODB_URI')

if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable not set")

def clear_elo_collection():
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        
        # Get the UPenn database and elo collection
        db = client['UPenn']
        elo_collection = db['elo']
        
        # Delete all documents in the collection
        result = elo_collection.delete_many({})
        
        print(f"Cleared {result.deleted_count} documents from the elo collection")
        
    except Exception as e:
        print(f"An error occurred while clearing elo collection: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    clear_elo_collection() 