from fastapi import APIRouter, Depends
from models.user import User
from dependencies import get_db

router = APIRouter()

@router.get("/check")
async def check_user_exists(email: str, db = Depends(get_db)):
    user_model = User(db)
    user = await user_model.get_user_by_email(email)
    return {"exists": user is not None}
