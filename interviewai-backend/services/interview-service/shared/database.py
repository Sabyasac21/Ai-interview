# shared/database.py
# Shared DB connection helpers — copy into each service or mount as a volume

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from motor.motor_asyncio import AsyncIOMotorClient
from functools import lru_cache
import os


# ─── MySQL (SQLAlchemy async) ─────────────────────────────────

class Base(DeclarativeBase):
    pass


def get_mysql_engine(url: str):
    return create_async_engine(
        url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False,
    )


def get_session_factory(engine):
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# Dependency for FastAPI routes
async def get_db_session(session_factory):
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ─── MongoDB (Motor async) ────────────────────────────────────

_mongo_client: AsyncIOMotorClient | None = None


def get_mongo_client(url: str) -> AsyncIOMotorClient:
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(url)
    return _mongo_client


def get_mongo_db(client: AsyncIOMotorClient, db_name: str = "interviewai"):
    return client[db_name]