from pymongo import MongoClient
from dotenv import load_dotenv
import os

#Note to EMao, please run this script with caution. It could mess up the entire database.

# Load environment variables
load_dotenv()

# Get MongoDB URI from environment variable
MONGODB_URI = os.getenv('MONGODB_URI')

if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable not set")

def rename_database():
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        
        # Copy all collections from profilematch to UPenn
        source_db = client['profilematch']
        target_db = client['UPenn']
        
        # Get all collections from source database
        collections = source_db.list_collection_names()
        
        print("Starting database rename process...")
        print(f"Found {len(collections)} collections to transfer")
        
        # Copy each collection
        for collection_name in collections:
            print(f"Copying collection: {collection_name}")
            source_collection = source_db[collection_name]
            target_collection = target_db[collection_name]
            
            # Copy all documents
            documents = list(source_collection.find({}))
            if documents:
                target_collection.insert_many(documents)
        
        print("Database successfully renamed from 'profilematch' to 'UPenn'")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    rename_database()
