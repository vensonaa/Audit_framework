from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.product import Product
from app.services.javers_service import get_javers_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ProductCreate(BaseModel):
    name: str
    description: str = None
    price: float
    category: str
    stock_quantity: int = 0

class ProductUpdate(BaseModel):
    name: str = None
    description: str = None
    price: float = None
    category: str = None
    stock_quantity: int = None

class ProductResponse(BaseModel):
    id: int
    name: str
    description: str = None
    price: float
    category: str
    stock_quantity: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, obj):
        # Handle None values for updated_at
        data = {
            'id': obj.id,
            'name': obj.name,
            'description': obj.description,
            'price': obj.price,
            'category': obj.category,
            'stock_quantity': obj.stock_quantity,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at if obj.updated_at else None
        }
        return cls(**data)

@router.post("/", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    """Create a new product with audit tracking"""
    db_product = Product(
        name=product.name,
        description=product.description,
        price=product.price,
        category=product.category,
        stock_quantity=product.stock_quantity
    )
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # Audit logging
    javers_service = get_javers_service()
    javers_service.commit_changes(db_product, "Product created")
    
    return db_product



@router.get("/", response_model=List[ProductResponse])
async def get_products(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    db: Session = Depends(get_db)
):
    """Get all products with optional category filter"""
    query = db.query(Product)
    
    if category:
        query = query.filter(Product.category == category)
    
    products = query.offset(skip).limit(limit).all()
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update a product with audit tracking"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Store old values for audit
    old_values = {
        "name": db_product.name,
        "description": db_product.description,
        "price": db_product.price,
        "category": db_product.category,
        "stock_quantity": db_product.stock_quantity
    }
    
    # Update fields
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db_product.updated_at = datetime.now()
    db.commit()
    db.refresh(db_product)
    
    # Audit logging
    javers_service = get_javers_service()
    javers_service.commit_changes(db_product, "Product updated")
    
    return db_product

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Delete a product with audit tracking"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Store product data before deletion for audit
    product_data = {
        "id": db_product.id,
        "name": db_product.name,
        "description": db_product.description,
        "price": db_product.price,
        "category": db_product.category,
        "stock_quantity": db_product.stock_quantity
    }
    
    db.delete(db_product)
    db.commit()
    
    # Audit logging
    javers_service = get_javers_service()
    javers_service.commit_changes(product_data, "Product deleted")
    
    return {"message": "Product deleted successfully"}

@router.get("/categories/list")
async def get_categories(db: Session = Depends(get_db)):
    """Get all product categories"""
    categories = db.query(Product.category).distinct().all()
    return {"categories": [cat[0] for cat in categories]}
