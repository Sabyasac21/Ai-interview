from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import date, datetime, timezone, timedelta
import os, sys, asyncio, uuid, logging
import httpx
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.append("/app/shared")
from database import Base, get_mysql_engine, get_session_factory, get_db_session
from auth import create_access_token, get_current_user
from models import User

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(title="User Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# File upload configuration
UPLOAD_DIR = Path("/app/services/user-service/uploads/avatars")
try:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"✅ Upload directory created/exists: {UPLOAD_DIR}")
except Exception as e:
    logger.error(f"❌ Failed to create upload directory: {e}")

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

# Serve uploaded files - with error handling
try:
    uploads_base = Path("/app/services/user-service/uploads")
    uploads_base.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_base)), name="uploads")
    logger.info(f"✅ Static files mounted at /uploads")
except Exception as e:
    logger.error(f"⚠️ Could not mount static files: {e}")

MYSQL_URL = os.getenv("MYSQL_URL", "mysql+aiomysql://root:rootpassword@interviewai_mysql:3306/interviewai")
HISTORY_SERVICE_URL = os.getenv("HISTORY_SERVICE_URL", "http://history-service:8003")
engine = get_mysql_engine(MYSQL_URL)
SessionFactory = get_session_factory(engine)
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def get_db():
    async for session in get_db_session(SessionFactory):
        yield session


def _get_user_timezone(request: Request) -> str:
    tz = (request.headers.get("x-user-timezone") or "UTC").strip()
    try:
        ZoneInfo(tz)
        return tz
    except Exception:
        return "UTC"


def _today_and_yesterday_for_tz(tz_name: str) -> tuple[date, date]:
    now_local = datetime.now(ZoneInfo(tz_name))
    today_local = now_local.date()
    return today_local, (today_local - timedelta(days=1))


@app.on_event("startup")
async def startup():
    # Retry connecting to MySQL up to 10 times
    for attempt in range(10):
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
                # create tables if they don't exist
                await conn.run_sync(Base.metadata.create_all)

                # Add social link columns only if they are missing. MySQL <8.0.16
                # doesn't support "IF NOT EXISTS" on ADD COLUMN, so we query
                # information_schema and add when needed.
                for col in ("github_url", "linkedin_url", "portfolio_url", "title", "profile_summary"):
                    res = await conn.execute(
                        text(
                            "SELECT COUNT(*) FROM information_schema.COLUMNS \
                             WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' \
                             AND COLUMN_NAME=:col"
                        ).bindparams(col=col)
                    )
                    count = res.scalar_one()
                    if count == 0:
                        if col in ("title", "profile_summary"):
                            col_type = "VARCHAR(100)" if col == "title" else "VARCHAR(1000)"
                        else:
                            col_type = "VARCHAR(500)"
                        await conn.execute(
                            text(f"ALTER TABLE users ADD COLUMN {col} {col_type}")
                        )
                        logger.info(f"Added missing column {col} to users table")

            logger.info("✅ Connected to MySQL successfully")
            return
        except Exception as e:
            logger.warning(f"⏳ MySQL connection/setup issue (attempt {attempt + 1}/10): {e}")
            await asyncio.sleep(3)
    logger.error("❌ Could not connect to MySQL after 10 attempts")


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


@app.get("/health")
async def health():
    return {"status": "ok", "service": "user-service"}


@app.post("/auth/register", status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.email == body.email))
        if result.scalar_one_or_none():
            raise HTTPException(400, "Email already registered")
        user = User(
            id=str(uuid.uuid4()),
            email=body.email,
            username=body.username,
            password_hash=pwd_ctx.hash(body.password),
            full_name=body.full_name,
        )
        db.add(user)
        await db.flush()
        await db.commit()
        token = create_access_token(user.id, user.email)
        return {"access_token": token, "token_type": "bearer", "user_id": user.id}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Register error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.post("/auth/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        # check whether the email exists first, then verify the password separately
        result = await db.execute(select(User).where(User.email == body.email))
        user = result.scalar_one_or_none()
        if not user:
            # user not registered -- return 404 to differentiate from bad password
            raise HTTPException(status_code=404, detail="Email not registered")
        if not pwd_ctx.verify(body.password, user.password_hash):
            # wrong password
            raise HTTPException(status_code=401, detail="Incorrect password")

        token = create_access_token(user.id, user.email)
        return {"access_token": token, "token_type": "bearer", "user_id": user.id}
    except HTTPException:
        # Re-raise HTTPExceptions (like 404, 401)
        raise
    except Exception as e:
        await db.rollback()
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.post("/users/me/streak/on-success")
async def update_streak_on_success(request: Request, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    UTC streak mutation on first successful solve of a UTC day.
    Rules:
    - If already solved today (last_active == today in user's timezone): no change
    - If last success was yesterday in user's timezone: +1
    - Else: reset/start to 1
    """
    result = await db.execute(select(User).where(User.id == current_user["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    tz_name = _get_user_timezone(request)
    today_local, yesterday_local = _today_and_yesterday_for_tz(tz_name)

    if user.last_active == today_local:
        return {
            "streak_days": user.streak_days,
            "last_active": user.last_active.isoformat() if user.last_active else None,
            "timezone": tz_name,
        }

    if user.last_active == yesterday_local:
        user.streak_days = max(0, int(user.streak_days or 0)) + 1
    else:
        user.streak_days = 1

    user.last_active = today_local
    await db.commit()
    return {"streak_days": user.streak_days, "last_active": user.last_active.isoformat(), "timezone": tz_name}


@app.post("/users/me/sync-streak")
async def sync_streak(request: Request, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    One-time app-start sync (user timezone):
    - fetch latest successful submission day from history-service
    - if latest success is older than yesterday (or absent): streak = 0
    - if latest success is yesterday/today: keep existing streak
    """
    result = await db.execute(select(User).where(User.id == current_user["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    auth_header = request.headers.get("authorization")
    if not auth_header:
        raise HTTPException(401, "Missing authorization header")

    tz_name = _get_user_timezone(request)
    latest_success_day = None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{HISTORY_SERVICE_URL}/history/stats/latest-success-day",
                headers={"Authorization": auth_header},
                params={"timezone": tz_name},
            )
            if resp.status_code == 200:
                payload = (resp.json() or {})
                latest_success_day = payload.get("latest_success_day") or payload.get("latest_success_day_utc")
    except Exception as e:
        logger.warning(f"Failed streak sync history lookup: {e}")
        # Fail-open: preserve existing streak if history lookup fails.
        return {
            "streak_days": user.streak_days,
            "last_active": user.last_active.isoformat() if user.last_active else None,
            "synced": False,
        }

    today_local, yesterday_local = _today_and_yesterday_for_tz(tz_name)

    latest_date = None
    if isinstance(latest_success_day, str) and latest_success_day:
        try:
            latest_date = date.fromisoformat(latest_success_day)
        except Exception:
            latest_date = None

    if latest_date is None or latest_date < yesterday_local:
        user.streak_days = 0
        user.last_active = latest_date
        await db.commit()
    else:
        # keep current streak; normalize last_active when missing
        if user.last_active is None:
            user.last_active = latest_date
            await db.commit()

    return {
        "streak_days": user.streak_days,
        "last_active": user.last_active.isoformat() if user.last_active else None,
        "latest_success_day_utc": latest_success_day,
        "timezone": tz_name,
        "synced": True,
    }


@app.get("/users/me")
async def get_me(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == current_user["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return {
        "id": user.id, "email": user.email, "username": user.username,
        "full_name": user.full_name, "avatar_url": user.avatar_url,
        "title": user.title, "profile_summary": user.profile_summary,
        "github_url": user.github_url, "linkedin_url": user.linkedin_url, "portfolio_url": user.portfolio_url,
        "plan": user.plan, "plan_active": user.plan_active,
        "credits_used": user.credits_used, "credits_limit": user.credits_limit,
        "streak_days": user.streak_days, "level": user.level, "level_title": user.level_title,
    }


@app.patch("/users/me")
async def update_me(
    full_name: str = Form(None),
    avatar: UploadFile = File(None),
    github_url: str = Form(None),
    linkedin_url: str = Form(None),
    portfolio_url: str = Form(None),
    title: str = Form(None),
    profile_summary: str = Form(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        logger.debug(f"=== UPDATE REQUEST ===")
        logger.debug(f"User: {current_user.get('sub')}")
        logger.debug(f"Full Name: {full_name}")
        logger.debug(f"Avatar Present: {avatar is not None}")
        
        result = await db.execute(select(User).where(User.id == current_user["sub"]))
        user = result.scalar_one_or_none()
        if not user:
            logger.error(f"User not found: {current_user['sub']}")
            raise HTTPException(404, "User not found")
        
        logger.debug(f"User found: {user.id} ({user.email})")
        
        # Update full name if provided
        if full_name is not None and full_name.strip():
            old_name = user.full_name
            user.full_name = full_name.strip()
            logger.info(f"Updated full_name: {old_name} → {full_name}")
        
        # Handle avatar file upload
        avatar_updated = False
        if avatar is not None and hasattr(avatar, 'filename') and avatar.filename:
            try:
                logger.debug(f"Avatar filename: {avatar.filename}")
                logger.debug(f"Avatar content_type: {avatar.content_type}")
                
                # Read file contents
                contents = await avatar.read()
                file_size = len(contents)
                logger.debug(f"Avatar file size: {file_size} bytes")
                
                if file_size == 0:
                    logger.warning("Avatar file is empty, skipping")
                else:
                    # Validate file type
                    if avatar.content_type not in ALLOWED_TYPES:
                        logger.error(f"Invalid file type: {avatar.content_type}")
                        raise HTTPException(400, f"Invalid file type: {avatar.content_type}. Allowed: {', '.join(ALLOWED_TYPES)}")
                    
                    # Validate file size
                    if file_size > MAX_FILE_SIZE:
                        logger.error(f"File too large: {file_size} > {MAX_FILE_SIZE}")
                        raise HTTPException(400, f"File too large ({file_size} bytes). Max: 5MB")
                    
                    # Ensure upload directory exists
                    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                    logger.debug(f"Upload directory ready: {UPLOAD_DIR}")
                    
                    # Generate unique filename
                    ext = Path(avatar.filename).suffix if avatar.filename else ".jpg"
                    filename = f"{user.id}_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}{ext}"
                    filepath = UPLOAD_DIR / filename
                    
                    # Save file
                    try:
                        filepath.write_bytes(contents)
                        logger.info(f"✅ Avatar saved to: {filepath}")
                    except Exception as e:
                        logger.error(f"Failed to write file {filepath}: {str(e)}")
                        raise HTTPException(500, f"Failed to save avatar: {str(e)}")
                    
                    # Update avatar_url in database
                    old_avatar = user.avatar_url
                    user.avatar_url = f"/api/users/avatars/{filename}"
                    avatar_updated = True
                    logger.info(f"Avatar URL updated: {old_avatar} → {user.avatar_url}")
                    
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"❌ Error processing avatar: {str(e)}", exc_info=True)
                raise HTTPException(400, f"Error processing avatar: {str(e)}")
        
        # Update social media links if provided
        if github_url is not None:
            user.github_url = github_url.strip() if github_url.strip() else None
        if linkedin_url is not None:
            user.linkedin_url = linkedin_url.strip() if linkedin_url.strip() else None
        if portfolio_url is not None:
            user.portfolio_url = portfolio_url.strip() if portfolio_url.strip() else None
        
        # Update title and profile summary if provided
        if title is not None:
            user.title = title.strip() if title.strip() else None
        if profile_summary is not None:
            user.profile_summary = profile_summary.strip() if profile_summary.strip() else None
        
        # Commit changes
        user.updated_at = datetime.utcnow()
        await db.commit()
        logger.info(f"✅ User {user.id} updated successfully (name_changed={full_name is not None}, avatar_changed={avatar_updated})")
        
        return {
            "message": "Updated successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "avatar_url": user.avatar_url,
                "title": user.title,
                "profile_summary": user.profile_summary,
                "github_url": user.github_url,
                "linkedin_url": user.linkedin_url,
                "portfolio_url": user.portfolio_url,
                "plan": user.plan,
                "plan_active": user.plan_active,
                "credits_used": user.credits_used,
                "credits_limit": user.credits_limit,
                "streak_days": user.streak_days,
                "level": user.level,
                "level_title": user.level_title,
            }
        }
    except HTTPException as e:
        logger.error(f"HTTPException: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ CRITICAL: Profile update failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.post("/users/me/change-password")
async def change_password(body: PasswordChangeRequest, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.id == current_user["sub"]))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(404, "User not found")
        
        # Verify current password
        if not pwd_ctx.verify(body.current_password, user.password_hash):
            raise HTTPException(401, "Current password is incorrect")
        
        # Update password
        user.password_hash = pwd_ctx.hash(body.new_password)
        await db.commit()
        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Password change error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.get("/users/{user_id}")
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return {"id": user.id, "username": user.username, "level": user.level, "streak_days": user.streak_days}


@app.get("/avatars/{filename}")
@app.get("/users/avatars/{filename}")
@app.head("/avatars/{filename}")
@app.head("/users/avatars/{filename}")
async def get_avatar(filename: str):
    """Serve uploaded avatar images"""
    try:
        filepath = UPLOAD_DIR / filename
        if not filepath.exists():
            logger.warning(f"Avatar not found: {filepath}")
            raise HTTPException(404, "Avatar not found")
        
        logger.debug(f"Serving avatar: {filepath}")
        return FileResponse(
            filepath,
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=3600"}
        )
    except FileNotFoundError:
        raise HTTPException(404, "Avatar not found")
    except Exception as e:
        logger.error(f"Error serving avatar: {str(e)}")
        raise HTTPException(500, "Error serving avatar")


@app.get("/debug/upload-status")
async def upload_status():
    """Debug endpoint to check upload directory status"""
    try:
        upload_dir_exists = UPLOAD_DIR.exists()
        upload_dir_is_dir = UPLOAD_DIR.is_dir() if upload_dir_exists else False
        upload_dir_writable = UPLOAD_DIR.stat().st_mode & 0o200 > 0 if upload_dir_exists else False
        
        files = []
        if upload_dir_exists:
            files = [f.name for f in UPLOAD_DIR.glob("*")]
        
        return {
            "upload_dir": str(UPLOAD_DIR),
            "exists": upload_dir_exists,
            "is_directory": upload_dir_is_dir,
            "writable": upload_dir_writable,
            "files_count": len(files),
            "sample_files": files[:5] if files else [],
            "max_file_size": MAX_FILE_SIZE,
            "allowed_types": list(ALLOWED_TYPES),
        }
    except Exception as e:
        logger.error(f"Debug error: {str(e)}")
        return {"error": str(e)}
