from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from ..core.database import Base

class TransactionType(str, enum.Enum):
    TRADE_PNL = "trade_pnl"
    PROP_PAYOUT = "prop_payout"
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    CHALLENGE_FEE = "challenge_fee"
    EXPENSE = "expense"
    MANUAL_ADJUSTMENT = "manual_adjustment"

class PersonalAccount(Base):
    __tablename__ = "personal_accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    broker_name = Column(String, nullable=False)
    account_number = Column(String, nullable=True)
    currency = Column(String, default="USD")
    initial_balance = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    trades = relationship("Trade", back_populates="personal_account")
    transactions = relationship("LedgerTransaction", back_populates="personal_account")

class LedgerTransaction(Base):
    __tablename__ = "ledger_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    source_type = Column(String, nullable=True)
    source_id = Column(Integer, nullable=True)
    personal_account_id = Column(Integer, ForeignKey("personal_accounts.id"), nullable=True)
    prop_account_id = Column(Integer, ForeignKey("prop_accounts.id"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    description = Column(Text, nullable=True)
    transaction_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    personal_account = relationship("PersonalAccount", back_populates="transactions")
    prop_account = relationship("PropAccount")

class JournalReview(Base):
    __tablename__ = "journal_reviews"

    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id"), nullable=False)
    setup_quality = Column(Integer, nullable=True)
    execution_quality = Column(Integer, nullable=True)
    rule_violations = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    lessons = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    trade = relationship("Trade", back_populates="reviews")
    screenshots = relationship("Screenshot", back_populates="review", cascade="all, delete-orphan")

class Screenshot(Base):
    __tablename__ = "screenshots"

    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id"), nullable=True)
    entity_type = Column(String, nullable=False)  # trade, review, setup, test_run
    entity_id = Column(Integer, nullable=False)
    review_id = Column(Integer, ForeignKey("journal_reviews.id"), nullable=True)
    file_path = Column(String, nullable=False)
    file_hash = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    review = relationship("JournalReview", back_populates="screenshots")