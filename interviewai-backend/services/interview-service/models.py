from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import sys
sys.path.append("/app/shared")
from database import Base


class InterviewTemplate(Base):
    __tablename__ = "interview_templates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    company: Mapped[str | None] = mapped_column(String(100))
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)  # Easy, Medium, Hard
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    categories: Mapped[str | None] = mapped_column(JSON)  # JSON array of categories
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    template_id: Mapped[int] = mapped_column(Integer, ForeignKey("interview_templates.id"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(50), nullable=False)  # behavioral, technical, system_design
    time_limit_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    hints: Mapped[str | None] = mapped_column(JSON)  # JSON array of hints
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    template_id: Mapped[int] = mapped_column(Integer, ForeignKey("interview_templates.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # scheduled, in_progress, completed, cancelled
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime)
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    total_score: Mapped[float | None] = mapped_column(Float)
    feedback: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class InterviewResponse(Base):
    __tablename__ = "interview_responses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("interview_questions.id"), nullable=False)
    response_text: Mapped[str | None] = mapped_column(Text)  # For text responses
    audio_url: Mapped[str | None] = mapped_column(String(500))  # For audio recordings
    video_url: Mapped[str | None] = mapped_column(String(500))  # For video recordings
    score: Mapped[float | None] = mapped_column(Float)
    feedback: Mapped[str | None] = mapped_column(Text)
    response_time_seconds: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)