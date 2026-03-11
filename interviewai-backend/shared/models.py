# shared/models.py
# SQLAlchemy ORM models shared across services

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, Enum, JSON, DECIMAL
from sqlalchemy.orm import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    title = Column(String(100), nullable=True)
    profile_summary = Column(String(1000), nullable=True)
    plan = Column(String(50), default="free")
    plan_active = Column(Boolean, default=False)
    credits_used = Column(Integer, default=0)
    credits_limit = Column(Integer, default=100)
    streak_days = Column(Integer, default=0)
    last_active = Column(Date, nullable=True)
    level = Column(Integer, default=1)
    level_title = Column(String(100), default="Beginner")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SkillCategory(Base):
    __tablename__ = "skill_categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    icon = Column(String(50))
    total_questions = Column(Integer, default=0)
    is_locked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True)
    category_id = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    difficulty = Column(String(50), default="medium")
    type = Column(String(50), default="coding")
    tags = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(String(36), nullable=False)
    category_id = Column(Integer, nullable=False)
    questions_solved = Column(Integer, default=0)
    score_percentage = Column(DECIMAL(5, 2), default=0.00)
    percentile_rank = Column(DECIMAL(5, 2), default=0.00)
    last_practiced = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), nullable=False)
    question_id = Column(String(36), nullable=False)
    category_id = Column(Integer, nullable=False)
    status = Column(String(50), default="in_progress")  # in_progress, submitted, evaluated
    score = Column(Integer, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    icon = Column(String(100), nullable=True)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), nullable=False)
    achievement_id = Column(String(36), nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
