# Authentication utilities - disabled for now
# Can be re-enabled when authentication is added back

# from fastapi import HTTPException, Header
# from typing import Optional
# from app.database import supabase


# async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
#     """Extract and verify user from Authorization header (Bearer token)"""
#     if not authorization:
#         raise HTTPException(status_code=401, detail="Authorization header missing")
#     
#     try:
#         token = authorization.replace("Bearer ", "")
#         response = supabase.auth.get_user(token)
#         if not response.user:
#             raise HTTPException(status_code=401, detail="Invalid token")
#         return response.user
#     except Exception as e:
#         raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


# async def verify_user_access(user_id: str, resource_user_id: str):
#     """Verify that the user has access to a resource"""
#     if user_id != resource_user_id:
#         raise HTTPException(status_code=403, detail="Access denied")
