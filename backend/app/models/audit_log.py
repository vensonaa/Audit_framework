from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, index=True, nullable=False)
    entity_type = Column(String, nullable=False)  # User, Product, etc.
    entity_id = Column(String, nullable=False)
    change_type = Column(String, nullable=False)  # CREATED, UPDATED, DELETED
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    changed_fields = Column(JSON, nullable=True)
    author = Column(String, nullable=True)
    commit_id = Column(String, nullable=False)
    commit_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<AuditLog(id={self.id}, entity_type='{self.entity_type}', change_type='{self.change_type}')>"
