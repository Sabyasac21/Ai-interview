from sqlalchemy import String, Integer, Boolean, Enum, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, date
import uuid, sys
sys.path.append("/app/shared")
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    github_url: Mapped[str | None] = mapped_column(String(500))
    linkedin_url: Mapped[str | None] = mapped_column(String(500))
    portfolio_url: Mapped[str | None] = mapped_column(String(500))
    title: Mapped[str | None] = mapped_column(String(100))
    profile_summary: Mapped[str | None] = mapped_column(String(1000))
    plan: Mapped[str] = mapped_column(Enum("free", "pro", "enterprise"), default="free")
    plan_active: Mapped[bool] = mapped_column(Boolean, default=False)
    credits_used: Mapped[int] = mapped_column(Integer, default=0)
    credits_limit: Mapped[int] = mapped_column(Integer, default=100)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    last_active: Mapped[date | None] = mapped_column(Date)
    level: Mapped[int] = mapped_column(Integer, default=1)
    level_title: Mapped[str] = mapped_column(String(100), default="Beginner")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)