from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.services.javers_service import get_javers_service
from app.models.audit_log import AuditLog
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/transactions/{transaction_id}")
async def get_transaction_audit(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """Get all audit information for a specific transaction"""
    javers_service = get_javers_service()
    
    # Get changes from Javers
    javers_changes = javers_service.get_changes_for_transaction(transaction_id)
    
    # Get audit logs from database
    audit_logs = db.query(AuditLog).filter(
        AuditLog.transaction_id == transaction_id
    ).all()
    
    return {
        "transaction_id": transaction_id,
        "javers_changes": javers_changes,
        "audit_logs": [
            {
                "id": log.id,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "change_type": log.change_type,
                "old_values": log.old_values,
                "new_values": log.new_values,
                "changed_fields": log.changed_fields,
                "author": log.author,
                "commit_date": log.commit_date,
                "created_at": log.created_at
            }
            for log in audit_logs
        ]
    }

@router.get("/entity/{entity_type}/{entity_id}")
async def get_entity_history(
    entity_type: str,
    entity_id: str,
    db: Session = Depends(get_db)
):
    """Get audit history for a specific entity"""
    javers_service = get_javers_service()
    
    # Get history from Javers
    javers_history = javers_service.get_entity_history(entity_type, entity_id)
    
    # Get audit logs from database
    audit_logs = db.query(AuditLog).filter(
        AuditLog.entity_type == entity_type,
        AuditLog.entity_id == entity_id
    ).order_by(AuditLog.commit_date.desc()).all()
    
    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "javers_history": javers_history,
        "audit_logs": [
            {
                "id": log.id,
                "transaction_id": log.transaction_id,
                "change_type": log.change_type,
                "old_values": log.old_values,
                "new_values": log.new_values,
                "changed_fields": log.changed_fields,
                "author": log.author,
                "commit_date": log.commit_date,
                "created_at": log.created_at
            }
            for log in audit_logs
        ]
    }

@router.get("/recent")
async def get_recent_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get recent audit logs"""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    audit_logs = db.query(AuditLog).filter(
        AuditLog.created_at >= cutoff_date
    ).order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    return {
        "audit_logs": [
            {
                "id": log.id,
                "transaction_id": log.transaction_id,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "change_type": log.change_type,
                "author": log.author,
                "commit_date": log.commit_date,
                "created_at": log.created_at
            }
            for log in audit_logs
        ]
    }

@router.get("/summary")
async def get_audit_summary(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get audit summary statistics"""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # Get total audit logs
    total_logs = db.query(AuditLog).filter(
        AuditLog.created_at >= cutoff_date
    ).count()
    
    # Get unique transactions
    unique_transactions = db.query(AuditLog.transaction_id).filter(
        AuditLog.created_at >= cutoff_date
    ).distinct().count()
    
    # Get change types breakdown
    change_types = db.query(AuditLog.change_type).filter(
        AuditLog.created_at >= cutoff_date
    ).all()
    
    change_type_counts = {}
    for change_type in change_types:
        change_type_counts[change_type[0]] = change_type_counts.get(change_type[0], 0) + 1
    
    # Get entity types breakdown
    entity_types = db.query(AuditLog.entity_type).filter(
        AuditLog.created_at >= cutoff_date
    ).all()
    
    entity_type_counts = {}
    for entity_type in entity_types:
        entity_type_counts[entity_type[0]] = entity_type_counts.get(entity_type[0], 0) + 1
    
    return {
        "period_days": days,
        "total_audit_logs": total_logs,
        "unique_transactions": unique_transactions,
        "change_type_breakdown": change_type_counts,
        "entity_type_breakdown": entity_type_counts
    }
