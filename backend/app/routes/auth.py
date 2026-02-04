# Authentication routes - disabled for now
# Can be re-enabled when authentication is added back

# from fastapi import APIRouter, HTTPException, Header
# from typing import Optional
# from app.database import supabase
# from app.utils.auth import get_current_user

# router = APIRouter()


# @router.get("/me")
# async def get_current_user_info(authorization: Optional[str] = Header(None)):
#     """Get current authenticated user"""
#     user = await get_current_user(authorization)
#     
#     # Get user profile from database
#     response = supabase.table("user_profiles").select("*").eq("id", user.id).execute()
#     
#     if not response.data:
#         raise HTTPException(status_code=404, detail="User profile not found")
#     
#     return response.data[0]
