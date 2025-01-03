from fastapi import APIRouter, HTTPException
from src.school_info import SchoolInfo
from bson import ObjectId
from pydantic import BaseModel

router = APIRouter()
school_info = SchoolInfo()

@router.get("/logo")
async def get_logo():
    try:
        logo = await school_info.get_logo()
        if not logo:
            raise HTTPException(status_code=404, detail="Logo not found")
        return {"logo": logo}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/name")
async def get_school_name():
    try:
        name = await school_info.get_school_name()
        return {"name": name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/domain")
async def get_school_domain():
    try:
        domain = await school_info.get_school_domain()
        return {"domain": domain}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/possible_names")
async def get_school_possible_names():
    try:
        possible_names = await school_info.get_school_possible_names()
        return {"possible_names": possible_names}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/all")
async def get_all_school_info():
    try:
        all_info = await school_info.get_all_school_info()
        print(all_info)
        return {"info": all_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
