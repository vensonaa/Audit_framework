from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    user_id = Column(Integer, nullable=True)  # User who initiated the transaction
    status = Column(String, default="completed")  # completed, failed, pending
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Transaction(id={self.id}, transaction_id='{self.transaction_id}')>"
