import os
from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Any, List, Tuple
import logging
from fastapi import HTTPException

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

class SchoolInfo:
    def __init__(self):
        """Initialize SchoolInfo with MongoDB connection"""
        load_dotenv()
        mongodb_uri = os.getenv('MONGODB_URI')
        self.mongo_client = AsyncIOMotorClient(mongodb_uri)
        
        # Connect to database
        self.db = self.mongo_client['UPenn']
        # Collections
        self.school_info_collection = self.db['info']
        print(self.school_info_collection)

    async def get_logo(self) -> str:
        try:
            school_info = await self.school_info_collection.find_one()
            print(school_info)
            if not school_info:
                raise HTTPException(status_code=404, detail="No school info found in database")
            
            logo = school_info.get('logo')
            if not logo:
                raise HTTPException(status_code=404, detail="Logo field not found in school info")
                
            return logo
        except Exception as e:
            logger.error(f"Error getting school info: {str(e)}")
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(status_code=500, detail=str(e))
        
    async def get_school_name(self) -> str:
        try:
            school_info = await self.school_info_collection.find_one()
            return school_info.get('name')
        except Exception as e:
            logger.error(f"Error getting school name: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
        
    async def get_school_domain(self) -> str:
        try:
            school_info = await self.school_info_collection.find_one()
            return school_info.get('domain')
        except Exception as e:
            logger.error(f"Error getting school domain: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_school_possible_names(self) -> List[str]:
        try:
            school_info = await self.school_info_collection.find_one()
            return school_info.get('school_names', [])
        except Exception as e:
            logger.error(f"Error getting school possible names: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
        
    async def get_all_school_info(self) -> Dict[str, Any]:
        try:
            school_info = await self.school_info_collection.find_one()
            return school_info
        except Exception as e:
            logger.error(f"Error getting all school info: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    