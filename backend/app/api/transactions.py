from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.models.product import Product
from app.models.audit_log import AuditLog
from app.services.javers_service import get_javers_service
from pydantic import BaseModel
import uuid
from datetime import datetime

router = APIRouter()

class TransactionCreate(BaseModel):
    description: str

class UserOperation(BaseModel):
    operation: str  # "create", "update", "delete"
    user_id: Optional[int] = None  # Required for update/delete
    data: Optional[Dict[str, Any]] = None  # Required for create/update

class ProductOperation(BaseModel):
    operation: str  # "create", "update", "delete"
    product_id: Optional[int] = None  # Required for update/delete
    data: Optional[Dict[str, Any]] = None  # Required for create/update

class TransactionOperation(BaseModel):
    operations: List[Dict[str, Any]]  # List of operations to perform

class TransactionResponse(BaseModel):
    id: int
    transaction_id: str
    description: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, obj):
        """Custom from_orm method to handle None values"""
        # Handle completed_at being None
        data = {
            'id': obj.id,
            'transaction_id': obj.transaction_id,
            'description': obj.description,
            'status': obj.status,
            'created_at': obj.created_at,
            'completed_at': obj.completed_at
        }
        return cls(**data)

@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db)
):
    """Create a new transaction"""
    try:
        transaction_id = str(uuid.uuid4())
        
        db_transaction = Transaction(
            transaction_id=transaction_id,
            description=transaction.description,
            status="pending"
        )
        
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        
        return db_transaction
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/{transaction_id}/execute", response_model=Dict[str, Any])
async def execute_transaction_operations(
    transaction_id: str,
    operations: TransactionOperation,
    db: Session = Depends(get_db)
):
    """Execute operations within a transaction"""
    # Verify transaction exists and is pending
    db_transaction = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if db_transaction.status == "completed":
        raise HTTPException(status_code=400, detail="Transaction already completed")
    
    # Start Javers transaction
    javers_service = get_javers_service()
    javers_service.start_transaction(transaction_id, "system")
    
    results = []
    audit_entries = []
    
    try:
        for operation in operations.operations:
            op_type = operation.get("type")
            
            if op_type == "user":
                result, audit_entry = await _execute_user_operation(operation, db)
                results.append(result)
                if audit_entry:
                    audit_entries.append(audit_entry)
            elif op_type == "product":
                result, audit_entry = await _execute_product_operation(operation, db)
                results.append(result)
                if audit_entry:
                    audit_entries.append(audit_entry)
            else:
                results.append({"error": f"Unknown operation type: {op_type}"})
        
        # Commit all database changes first
        db.commit()
        
        # Now write audit entries (defensive: do not fail whole request if one commit fails)
        commit_errors = []
        for audit_entry in audit_entries:
            try:
                javers_service.commit_changes(
                    audit_entry["entity"], 
                    audit_entry["message"],
                    audit_entry.get("change_type", "CREATED"),
                    audit_entry.get("old_values"),
                    audit_entry.get("changed_fields"),
                    audit_entry.get("entity_type"),
                    audit_entry.get("entity_id")
                )
            except Exception as ce:
                commit_errors.append({
                    "entity_type": audit_entry.get("entity_type") or audit_entry["entity"].__class__.__name__,
                    "entity_id": audit_entry.get("entity_id") or str(getattr(audit_entry["entity"], "id", "unknown")),
                    "error": str(ce)
                })
        
        response: Dict[str, Any] = {"message": "Operations executed successfully", "results": results}
        if commit_errors:
            response["audit_commit_errors"] = commit_errors
        return response
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(e)}")

@router.post("/{transaction_id}/complete")
async def complete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """Complete a transaction"""
    db_transaction = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if db_transaction.status == "completed":
        raise HTTPException(status_code=400, detail="Transaction already completed")
    
    # Check if transaction has at least one operation
    audit_logs_count = db.query(AuditLog).filter(
        AuditLog.transaction_id == transaction_id
    ).count()
    
    if audit_logs_count == 0:
        raise HTTPException(status_code=400, detail="Transaction cannot be completed without any operations. Please add at least one operation before completing.")
    
    db_transaction.status = "completed"
    db_transaction.completed_at = datetime.now()
    db.commit()
    
    # End Javers transaction
    javers_service = get_javers_service()
    javers_service.end_transaction()
    
    return {"message": "Transaction completed successfully"}

@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all transactions"""
    transactions = db.query(Transaction).order_by(
        Transaction.created_at.desc()
    ).offset(offset).limit(limit).all()
    
    return transactions

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific transaction"""
    transaction = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return transaction

@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """Delete a transaction (for cleanup purposes)"""
    transaction = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    
    return {"message": "Transaction deleted successfully"}

async def _execute_user_operation(operation: Dict[str, Any], db: Session):
    """Execute a user operation within a transaction"""
    op = operation.get("operation")
    
    if op == "create":
        user_data = operation.get("data", {})
        db_user = User(
            username=user_data.get("username"),
            email=user_data.get("email"),
            full_name=user_data.get("full_name"),
            is_active=user_data.get("is_active", True)
        )
        db.add(db_user)
        db.flush()  # Get the ID without committing
        
        audit_entry = {
            "entity": db_user,
            "message": "User created",
            "change_type": "CREATED"
        }
        
        return {
            "type": "user",
            "operation": "create",
            "success": True,
            "user_id": db_user.id,
            "data": {
                "id": db_user.id,
                "username": db_user.username,
                "email": db_user.email,
                "full_name": db_user.full_name,
                "is_active": db_user.is_active,
                "created_at": db_user.created_at
            }
        }, audit_entry
        
    elif op == "update":
        user_id = operation.get("user_id")
        user_data = operation.get("data", {})
        
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return {"type": "user", "operation": "update", "success": False, "error": "User not found"}
        
        # Store old values for audit
        old_values = {
            "username": db_user.username,
            "email": db_user.email,
            "full_name": db_user.full_name,
            "is_active": db_user.is_active
        }
        
        # Update fields and track actual changes
        changed_fields = []
        for field, value in user_data.items():
            if hasattr(db_user, field):
                old_value = getattr(db_user, field)
                if old_value != value:
                    setattr(db_user, field, value)
                    changed_fields.append(field)
        
        db_user.updated_at = datetime.now()
        db.flush()
        
        audit_entry = {
            "entity": db_user,
            "message": "User updated",
            "change_type": "UPDATED",
            "old_values": old_values,
            "changed_fields": changed_fields
        }
        
        return {
            "type": "user",
            "operation": "update",
            "success": True,
            "user_id": user_id,
            "old_values": old_values,
            "new_values": {
                "id": db_user.id,
                "username": db_user.username,
                "email": db_user.email,
                "full_name": db_user.full_name,
                "is_active": db_user.is_active,
                "updated_at": db_user.updated_at
            }
        }, audit_entry
        
    elif op == "delete":
        user_id = operation.get("user_id")
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return {"type": "user", "operation": "delete", "success": False, "error": "User not found"}
        
        # Store user data before deletion
        user_data = {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email,
            "full_name": db_user.full_name,
            "is_active": db_user.is_active
        }
        
        db.delete(db_user)
        db.flush()
        
        audit_entry = {
            "entity": user_data,
            "message": "User deleted",
            "change_type": "DELETED",
            "entity_type": "User",
            "entity_id": str(user_id)
        }
        
        return {
            "type": "user",
            "operation": "delete",
            "success": True,
            "user_id": user_id,
            "data": user_data
        }, audit_entry
    
    return {"type": "user", "operation": op, "success": False, "error": "Unknown operation"}

async def _execute_product_operation(operation: Dict[str, Any], db: Session):
    """Execute a product operation within a transaction"""
    op = operation.get("operation")
    
    if op == "create":
        product_data = operation.get("data", {})
        db_product = Product(
            name=product_data.get("name"),
            description=product_data.get("description"),
            price=product_data.get("price"),
            category=product_data.get("category"),
            stock_quantity=product_data.get("stock_quantity", 0)
        )
        db.add(db_product)
        db.flush()  # Get the ID without committing
        
        audit_entry = {
            "entity": db_product,
            "message": "Product created",
            "change_type": "CREATED"
        }
        
        return {
            "type": "product",
            "operation": "create",
            "success": True,
            "product_id": db_product.id,
            "data": {
                "id": db_product.id,
                "name": db_product.name,
                "description": db_product.description,
                "price": db_product.price,
                "category": db_product.category,
                "stock_quantity": db_product.stock_quantity,
                "created_at": db_product.created_at
            }
        }, audit_entry
        
    elif op == "update":
        product_id = operation.get("product_id")
        product_data = operation.get("data", {})
        
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            return {"type": "product", "operation": "update", "success": False, "error": "Product not found"}
        
        # Store old values for audit
        old_values = {
            "name": db_product.name,
            "description": db_product.description,
            "price": db_product.price,
            "category": db_product.category,
            "stock_quantity": db_product.stock_quantity
        }
        
        # Update fields and track actual changes
        changed_fields = []
        for field, value in product_data.items():
            if hasattr(db_product, field):
                old_value = getattr(db_product, field)
                if old_value != value:
                    setattr(db_product, field, value)
                    changed_fields.append(field)
        
        db_product.updated_at = datetime.now()
        db.flush()
        
        audit_entry = {
            "entity": db_product,
            "message": "Product updated",
            "change_type": "UPDATED",
            "old_values": old_values,
            "changed_fields": changed_fields
        }
        
        return {
            "type": "product",
            "operation": "update",
            "success": True,
            "product_id": product_id,
            "old_values": old_values,
            "new_values": {
                "id": db_product.id,
                "name": db_product.name,
                "description": db_product.description,
                "price": db_product.price,
                "category": db_product.category,
                "stock_quantity": db_product.stock_quantity,
                "updated_at": db_product.updated_at
            }
        }, audit_entry
        
    elif op == "delete":
        product_id = operation.get("product_id")
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            return {"type": "product", "operation": "delete", "success": False, "error": "Product not found"}
        
        # Store product data before deletion
        product_data = {
            "id": db_product.id,
            "name": db_product.name,
            "description": db_product.description,
            "price": db_product.price,
            "category": db_product.category,
            "stock_quantity": db_product.stock_quantity
        }
        
        db.delete(db_product)
        db.flush()
        
        audit_entry = {
            "entity": product_data,
            "message": "Product deleted",
            "change_type": "DELETED",
            "entity_type": "Product",
            "entity_id": str(product_id)
        }
        
        return {
            "type": "product",
            "operation": "delete",
            "success": True,
            "product_id": product_id,
            "data": product_data
        }, audit_entry
    
    return {"type": "product", "operation": op, "success": False, "error": "Unknown operation"}
