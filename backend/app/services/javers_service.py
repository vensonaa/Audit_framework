import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.audit_log import AuditLog

class JaversService:
    def __init__(self):
        self.current_transaction_id: Optional[str] = None
        self.current_author: Optional[str] = None

    def init_javers(self):
        """Initialize the audit service"""
        # This is a placeholder for Javers-like functionality
        # In a real implementation, you would integrate with Javers Java library
        pass

    def start_transaction(self, transaction_id: str, author: str = "system"):
        """Start a new transaction for auditing"""
        self.current_transaction_id = transaction_id
        self.current_author = author

    def end_transaction(self):
        """End the current transaction"""
        self.current_transaction_id = None
        self.current_author = None

    def commit_changes(self, entity: Any, commit_message: str = None, change_type: str = "CREATED", old_values: Dict[str, Any] = None, changed_fields: List[str] = None, entity_type: str = None, entity_id: str = None):
        """Commit changes for an entity"""
        if not self.current_transaction_id:
            raise Exception("No active transaction")

        # Create audit log entry
        db = SessionLocal()
        try:
            # Extract entity information
            if entity_type and entity_id:
                # Use provided entity type and ID (for delete operations)
                pass  # entity_type and entity_id are already set
            else:
                # Extract from entity object (for create/update operations)
                entity_type = entity.__class__.__name__
                entity_id = str(getattr(entity, 'id', 'unknown'))
            
            # Create audit log
            audit_log = AuditLog(
                transaction_id=self.current_transaction_id,
                entity_type=entity_type,
                entity_id=entity_id,
                change_type=change_type,
                old_values=old_values,
                new_values=self._extract_entity_values(entity),
                changed_fields=changed_fields,
                author=self.current_author,
                commit_id=str(uuid.uuid4()),
                commit_date=datetime.now()
            )
            
            db.add(audit_log)
            db.commit()
            
            return audit_log
        finally:
            db.close()

    def get_changes_for_transaction(self, transaction_id: str) -> List[Dict[str, Any]]:
        """Get all changes for a specific transaction"""
        db = SessionLocal()
        try:
            audit_logs = db.query(AuditLog).filter(
                AuditLog.transaction_id == transaction_id
            ).all()
            
            changes = []
            for log in audit_logs:
                change_data = {
                    "commit_id": log.commit_id,
                    "commit_date": log.commit_date,
                    "author": log.author,
                    "change_type": log.change_type,
                    "entity_type": log.entity_type,
                    "entity_id": log.entity_id,
                    "old_values": log.old_values,
                    "new_values": log.new_values,
                    "changed_fields": log.changed_fields,
                    "transaction_id": transaction_id
                }
                changes.append(change_data)
            
            return changes
        finally:
            db.close()

    def _extract_entity_values(self, entity: Any) -> Dict[str, Any]:
        """Extract values from an entity object"""
        values = {}
        
        # Handle dictionaries (for delete operations)
        if isinstance(entity, dict):
            for key, value in entity.items():
                # Convert datetime objects to strings for JSON serialization
                if isinstance(value, datetime):
                    values[key] = value.isoformat()
                else:
                    values[key] = value
        # Handle objects with __dict__ (for create/update operations)
        elif hasattr(entity, '__dict__'):
            for key, value in entity.__dict__.items():
                if not key.startswith('_'):
                    # Convert datetime objects to strings for JSON serialization
                    if isinstance(value, datetime):
                        values[key] = value.isoformat()
                    else:
                        values[key] = value
        
        return values

    def get_entity_history(self, entity_type: str, entity_id: str) -> List[Dict[str, Any]]:
        """Get history for a specific entity"""
        db = SessionLocal()
        try:
            audit_logs = db.query(AuditLog).filter(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id
            ).order_by(AuditLog.commit_date.desc()).all()
            
            history = []
            for log in audit_logs:
                history.append({
                    "commit_id": log.commit_id,
                    "commit_date": log.commit_date,
                    "author": log.author,
                    "state": log.new_values,
                    "change_type": log.change_type
                })
            
            return history
        finally:
            db.close()

# Global instance
javers_service = JaversService()

def init_javers():
    """Initialize Javers service"""
    javers_service.init_javers()

def get_javers_service() -> JaversService:
    """Get the global Javers service instance"""
    return javers_service
