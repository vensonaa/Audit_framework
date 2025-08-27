from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.services.javers_service import get_javers_service
from pydantic import BaseModel, EmailStr
from datetime import datetime

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    is_active: bool = True

class UserUpdate(BaseModel):
    username: str = None
    email: str = None
    full_name: str = None
    is_active: bool = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        # For older Pydantic versions, use this instead:
        # orm_mode = True
    
    @classmethod
    def from_orm(cls, obj):
        # Handle None values for updated_at
        data = {
            'id': obj.id,
            'username': obj.username,
            'email': obj.email,
            'full_name': obj.full_name,
            'is_active': obj.is_active,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at if obj.updated_at else None
        }
        return cls(**data)

@router.post("/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """Create a new user with audit tracking"""
    try:
        # Check if username or email already exists
        existing_user = db.query(User).filter(
            (User.username == user.username) | (User.email == user.email)
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already exists")
        
        db_user = User(
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Audit logging
        javers_service = get_javers_service()
        javers_service.commit_changes(db_user, "User created")
        
        return db_user
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")



@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all users"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db)
):
    """Update a user with audit tracking"""
    db_user = db.query(User).filter(User.id == user_id).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Store old values for audit
    old_values = {
        "username": db_user.username,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "is_active": db_user.is_active
    }
    
    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db_user.updated_at = datetime.now()
    db.commit()
    db.refresh(db_user)
    
    # Audit logging
    javers_service = get_javers_service()
    javers_service.commit_changes(db_user, "User updated")
    
    return db_user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Delete a user with audit tracking"""
    db_user = db.query(User).filter(User.id == user_id).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Store user data before deletion for audit
    user_data = {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "is_active": db_user.is_active
    }
    
    db.delete(db_user)
    db.commit()
    
    # Audit logging
    javers_service = get_javers_service()
    javers_service.commit_changes(user_data, "User deleted")
    
    return {"message": "User deleted successfully"}
