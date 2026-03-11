from sqlalchemy import String, Integer, Boolean, Enum, DateTime, JSON, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid, sys
sys.path.append("/app/shared")
from database import Base


class SkillCategory(Base):
    __tablename__ = "skill_categories"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50))
    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("skill_categories.id"), nullable=False)
    questions_solved: Mapped[int] = mapped_column(Integer, default=0)
    score_percentage: Mapped[float] = mapped_column(DECIMAL(5, 2), default=0.00)
    percentile_rank: Mapped[float] = mapped_column(DECIMAL(5, 2), default=0.00)
    last_practiced: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Question(Base):
    __tablename__ = "questions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("skill_categories.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    difficulty: Mapped[str] = mapped_column(Enum("easy", "medium", "hard"), default="medium")
    type: Mapped[str] = mapped_column(String(50), default="coding")  # coding, mcq, descriptive, system-design
    tags: Mapped[dict | None] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PracticeSession(Base):
    __tablename__ = "practice_sessions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("skill_categories.id"), nullable=False)
    question_id: Mapped[str] = mapped_column(String(36), ForeignKey("questions.id"), nullable=False)
    status: Mapped[str] = mapped_column(Enum("started", "submitted", "evaluated"), default="started")
    score: Mapped[float | None] = mapped_column(DECIMAL(5, 2))
    time_spent: Mapped[int | None] = mapped_column(Integer)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)