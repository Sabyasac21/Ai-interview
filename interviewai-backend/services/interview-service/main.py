from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, desc
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import os, sys, asyncio, json
from typing import List, Optional
import redis.asyncio as redis


def parse_iso_datetime(dt_str: str) -> datetime:
    """Parse an ISO datetime string (with optional trailing Z) into a datetime."""
    if dt_str.endswith("Z"):
        dt_str = dt_str[:-1] + "+00:00"
    return datetime.fromisoformat(dt_str)

sys.path.append("/app/shared")
from database import Base, get_mysql_engine, get_session_factory, get_db_session, get_mongo_client, get_mongo_db
from auth import get_current_user
from models import InterviewTemplate, InterviewQuestion, InterviewSession, InterviewResponse

app = FastAPI(title="Interview Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MYSQL_URL = os.getenv("MYSQL_URL", "mysql+aiomysql://root:rootpassword@localhost:3306/interviewai")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://root:rootpassword@localhost:27017/interviewai?authSource=admin")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
JUDGE_SERVICE_URL = os.getenv("JUDGE_SERVICE_URL", "http://interviewai_judge:8000")

engine = get_mysql_engine(MYSQL_URL)
SessionFactory = get_session_factory(engine)
mongo_client = get_mongo_client(MONGO_URL)
mongo_db = get_mongo_db(mongo_client)
redis_client = redis.from_url(REDIS_URL)


async def get_db():
    async for session in get_db_session(SessionFactory):
        yield session

def get_mongo():
    return mongo_db

def get_redis():
    return redis_client


@app.on_event("startup")
async def startup():
    for attempt in range(10):
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
                await conn.run_sync(Base.metadata.create_all)

                # Ensure `scheduled_at` column exists (backwards compatible schema migration)
                column_check = await conn.execute(text(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'interview_sessions' "
                    "AND COLUMN_NAME = 'scheduled_at'"
                ))
                if column_check.scalar_one() == 0:
                    await conn.execute(text("ALTER TABLE interview_sessions ADD COLUMN scheduled_at DATETIME NULL"))

            print("✅ Connected to MySQL successfully")

            # Seed initial data
            await seed_initial_data()
            return
        except Exception as e:
            print(f"⏳ MySQL not ready (attempt {attempt + 1}/10): {e}")
            await asyncio.sleep(3)


async def seed_initial_data():
    """Seed initial interview templates and questions"""
    try:
        async with SessionFactory() as session:
            # Check if data already exists
            result = await session.execute(text("SELECT COUNT(*) FROM interview_templates"))
            count = result.scalar()
            if count > 0:
                print("✅ Interview data already seeded")
                return

            # Create interview templates
            templates = [
                InterviewTemplate(
                    title="Software Engineer Interview",
                    description="Comprehensive interview for software engineering positions",
                    company="TechCorp",
                    difficulty="Medium",
                    duration_minutes=45,
                    question_count=8,
                    categories=["technical", "behavioral"]
                ),
                InterviewTemplate(
                    title="Frontend Developer Interview",
                    description="Focus on frontend technologies and user experience",
                    company="WebSolutions",
                    difficulty="Easy",
                    duration_minutes=30,
                    question_count=6,
                    categories=["frontend", "javascript", "react"]
                ),
                InterviewTemplate(
                    title="Full Stack Developer Interview",
                    description="Complete assessment of full-stack development skills",
                    company="InnovateLabs",
                    difficulty="Hard",
                    duration_minutes=60,
                    question_count=12,
                    categories=["backend", "frontend", "database", "system-design"]
                )
            ]

            for template in templates:
                session.add(template)
            await session.commit()

            # Get template IDs
            template_result = await session.execute(text("SELECT id, title FROM interview_templates"))
            template_map = {row[1]: row[0] for row in template_result}

            # Create questions
            questions_data = [
                # Software Engineer Interview
                (template_map["Software Engineer Interview"], [
                    ("Tell me about yourself and your experience.", "behavioral", 120, ["Focus on relevant experience", "Keep it under 2 minutes"]),
                    ("Explain the difference between let, const, and var in JavaScript.", "technical", 180, ["Scope differences", "Hoisting behavior", "Best practices"]),
                    ("How would you optimize a React application?", "technical", 240, ["Code splitting", "Memoization", "Bundle analysis"]),
                    ("Describe the MVC architecture pattern.", "technical", 180, ["Model-View-Controller", "Separation of concerns", "Data flow"]),
                    ("How do you handle state management in a large application?", "technical", 240, ["Redux/Context API", "State lifting", "Performance considerations"]),
                    ("Explain RESTful API design principles.", "technical", 180, ["HTTP methods", "Resource naming", "Status codes"]),
                    ("How would you approach debugging a production issue?", "behavioral", 180, ["Systematic approach", "Logging", "Monitoring"]),
                    ("What are your thoughts on testing and code quality?", "technical", 180, ["Unit testing", "Integration testing", "Code review"])
                ]),
                # Frontend Developer Interview
                (template_map["Frontend Developer Interview"], [
                    ("Walk me through your resume and experience.", "behavioral", 120, ["Highlight frontend skills", "Project examples"]),
                    ("Explain CSS Box Model.", "technical", 150, ["Content, padding, border, margin", "Box-sizing property"]),
                    ("How does React's virtual DOM work?", "technical", 180, ["Reconciliation", "Diffing algorithm", "Performance benefits"]),
                    ("Describe responsive design techniques.", "technical", 180, ["Media queries", "Flexbox/Grid", "Mobile-first approach"]),
                    ("How do you handle browser compatibility?", "technical", 150, ["Polyfills", "Feature detection", "Progressive enhancement"]),
                    ("Explain event delegation in JavaScript.", "technical", 150, ["Event bubbling", "Performance optimization", "Dynamic elements"])
                ]),
                # Full Stack Developer Interview
                (template_map["Full Stack Developer Interview"], [
                    ("Describe your development workflow.", "behavioral", 120, ["Version control", "Code review", "Deployment"]),
                    ("Explain database normalization.", "technical", 180, ["Normal forms", "Relationships", "Performance trade-offs"]),
                    ("How do you secure a web application?", "technical", 240, ["Authentication", "Authorization", "Common vulnerabilities"]),
                    ("Describe microservices architecture.", "system_design", 300, ["Service boundaries", "Communication", "Scalability"]),
                    ("How would you design a scalable API?", "system_design", 300, ["Rate limiting", "Caching", "Load balancing"]),
                    ("Explain asynchronous programming in JavaScript.", "technical", 180, ["Promises", "Async/await", "Event loop"]),
                    ("How do you handle database migrations?", "technical", 150, ["Version control", "Rollback strategy", "Data integrity"]),
                    ("Describe your approach to code refactoring.", "behavioral", 180, ["When to refactor", "Testing", "Incremental changes"]),
                    ("How would you optimize database queries?", "technical", 240, ["Indexing", "Query analysis", "Caching strategies"]),
                    ("Explain containerization and Docker.", "technical", 180, ["Images vs containers", "Dockerfile", "Orchestration"]),
                    ("How do you implement error handling?", "technical", 180, ["Try-catch", "Error boundaries", "Logging"]),
                    ("What are your thoughts on DevOps practices?", "behavioral", 180, ["CI/CD", "Infrastructure as code", "Monitoring"])
                ])
            ]

            for template_id, questions in questions_data:
                for i, (question, q_type, time_limit, hints) in enumerate(questions):
                    q = InterviewQuestion(
                        template_id=template_id,
                        question=question,
                        question_type=q_type,
                        time_limit_seconds=time_limit,
                        hints=hints,
                        order_index=i + 1
                    )
                    session.add(q)

            await session.commit()
            print("✅ Interview data seeded successfully")

    except Exception as e:
        print(f"❌ Error seeding data: {e}")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "interview-service"}


# Interview Templates
@app.get("/templates")
async def list_templates_old(db: AsyncSession = Depends(get_db)):
    return await list_templates_new(db)

@app.get("/interviews/templates")
async def list_templates_new(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InterviewTemplate).where(InterviewTemplate.is_active == True))
    templates = result.scalars().all()
    return [{
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "company": t.company,
        "difficulty": t.difficulty,
        "duration_minutes": t.duration_minutes,
        "question_count": t.question_count,
        "categories": t.categories
    } for t in templates]


@app.get("/templates/{template_id}")
async def get_template_old(template_id: int, db: AsyncSession = Depends(get_db)):
    return await get_template_new(template_id, db)

@app.get("/interviews/templates/{template_id}")
async def get_template_new(template_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InterviewTemplate).where(InterviewTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    questions_result = await db.execute(
        select(InterviewQuestion).where(InterviewQuestion.template_id == template_id)
        .order_by(InterviewQuestion.order_index)
    )
    questions = questions_result.scalars().all()

    return {
        "id": template.id,
        "title": template.title,
        "description": template.description,
        "company": template.company,
        "difficulty": template.difficulty,
        "duration_minutes": template.duration_minutes,
        "question_count": template.question_count,
        "categories": template.categories,
        "questions": [{
            "id": q.id,
            "question": q.question,
            "question_type": q.question_type,
            "time_limit_seconds": q.time_limit_seconds,
            "hints": q.hints
        } for q in questions]
    }


# Interview Sessions
@app.post("/interviews/sessions")
async def create_session(
    template_id: int,
    scheduled_at: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user["sub"]

    # Check if template exists
    template_result = await db.execute(select(InterviewTemplate).where(InterviewTemplate.id == template_id))
    template = template_result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    parsed_scheduled_at = None
    if scheduled_at:
        try:
            parsed_scheduled_at = parse_iso_datetime(scheduled_at)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid scheduled_at format")

    session = InterviewSession(
        user_id=user_id,
        template_id=template_id,
        status="scheduled",
        scheduled_at=parsed_scheduled_at
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return {"session_id": session.id, "status": "scheduled", "scheduled_at": session.scheduled_at.isoformat() if session.scheduled_at else None}


@app.get("/interviews/sessions")
async def list_user_sessions(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = current_user["sub"]
    result = await db.execute(
        select(InterviewSession, InterviewTemplate)
        .join(InterviewTemplate)
        .where(InterviewSession.user_id == user_id)
        .order_by(desc(InterviewSession.created_at))
    )

    sessions = []
    for session, template in result:
        sessions.append({
            "id": session.id,
            "template": {
                "id": template.id,
                "title": template.title,
                "company": template.company,
                "difficulty": template.difficulty
            },
            "status": session.status,
            "scheduled_at": session.scheduled_at.isoformat() if session.scheduled_at else None,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            "total_score": session.total_score,
            "created_at": session.created_at.isoformat()
        })

    return sessions


@app.get("/interviews/sessions/{session_id}")
async def get_session(session_id: int, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = current_user["sub"]
    result = await db.execute(
        select(InterviewSession, InterviewTemplate)
        .join(InterviewTemplate)
        .where(InterviewSession.id == session_id, InterviewSession.user_id == user_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    session, template = row

    responses_result = await db.execute(
        select(InterviewResponse, InterviewQuestion)
        .join(InterviewQuestion)
        .where(InterviewResponse.session_id == session_id)
        .order_by(InterviewQuestion.order_index)
    )

    responses = []
    for response, question in responses_result:
        responses.append({
            "question_id": question.id,
            "question": question.question,
            "response_text": response.response_text,
            "score": response.score,
            "feedback": response.feedback,
            "response_time_seconds": response.response_time_seconds
        })

    return {
        "id": session.id,
        "template": {
            "id": template.id,
            "title": template.title,
            "company": template.company,
            "difficulty": template.difficulty
        },
        "status": session.status,
        "scheduled_at": session.scheduled_at.isoformat() if session.scheduled_at else None,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "completed_at": session.completed_at.isoformat() if session.completed_at else None,
        "total_score": session.total_score,
        "feedback": session.feedback,
        "responses": responses
    }


@app.put("/interviews/sessions/{session_id}/start")
async def start_session(session_id: int, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = current_user["sub"]
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == session_id, InterviewSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != "scheduled":
        raise HTTPException(status_code=400, detail="Session cannot be started")

    session.status = "in_progress"
    session.started_at = datetime.utcnow()
    await db.commit()

    return {"status": "started"}


@app.put("/interviews/sessions/{session_id}/reschedule")
async def reschedule_session(
    session_id: int,
    scheduled_at: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current_user["sub"]
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == session_id, InterviewSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status not in ["scheduled", "cancelled"]:
        raise HTTPException(status_code=400, detail="Session cannot be rescheduled")

    try:
        parsed_scheduled_at = parse_iso_datetime(scheduled_at)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid scheduled_at format")

    session.scheduled_at = parsed_scheduled_at
    session.status = "scheduled"
    await db.commit()

    return {"status": "rescheduled", "scheduled_at": session.scheduled_at.isoformat()}


@app.post("/interviews/sessions/{session_id}/responses")
async def submit_response(
    session_id: int,
    question_id: int,
    response_data: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    user_id = current_user["sub"]

    # Verify session ownership
    session_result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == session_id, InterviewSession.user_id == user_id)
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != "in_progress":
        raise HTTPException(status_code=400, detail="Session is not in progress")

    # Create response
    response = InterviewResponse(
        session_id=session_id,
        question_id=question_id,
        response_text=response_data.get("response_text"),
        audio_url=response_data.get("audio_url"),
        video_url=response_data.get("video_url"),
        response_time_seconds=response_data.get("response_time_seconds")
    )
    db.add(response)
    await db.commit()
    await db.refresh(response)

    # Queue evaluation for background processing
    background_tasks.add_task(evaluate_response, response.id, response_data.get("response_text", ""))

    return {"response_id": response.id, "status": "submitted"}


async def evaluate_response(response_id: int, response_text: str):
    """Background task to evaluate interview response using judge service or AI"""
    try:
        # For now, use simple scoring based on length and keywords
        # In production, integrate with AI service for proper evaluation
        score = min(100, len(response_text.split()) * 2)  # Simple scoring

        feedback = "Good response with clear structure."
        if len(response_text.split()) < 10:
            feedback = "Response is too brief. Try to provide more detailed answers."
            score = max(20, score - 20)
        elif len(response_text.split()) > 100:
            feedback = "Response is comprehensive. Consider being more concise while maintaining key points."

        # Update response with score and feedback
        async with SessionFactory() as session:
            result = await session.execute(select(InterviewResponse).where(InterviewResponse.id == response_id))
            response = result.scalar_one_or_none()
            if response:
                response.score = score
                response.feedback = feedback
                await session.commit()

    except Exception as e:
        print(f"Error evaluating response {response_id}: {e}")


@app.put("/interviews/sessions/{session_id}/complete")
async def complete_session(session_id: int, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = current_user["sub"]
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == session_id, InterviewSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != "in_progress":
        raise HTTPException(status_code=400, detail="Session is not in progress")

    # Calculate total score
    responses_result = await db.execute(
        select(InterviewResponse.score).where(InterviewResponse.session_id == session_id)
    )
    scores = [r[0] for r in responses_result if r[0] is not None]
    total_score = sum(scores) / len(scores) if scores else 0

    session.status = "completed"
    session.completed_at = datetime.utcnow()
    session.total_score = total_score
    session.feedback = f"Overall performance: {total_score:.1f}%"

    await db.commit()

    return {"status": "completed", "total_score": total_score}


@app.put("/interviews/sessions/{session_id}/cancel")
async def cancel_session(session_id: int, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = current_user["sub"]
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == session_id, InterviewSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status not in ["scheduled", "in_progress"]:
        raise HTTPException(status_code=400, detail="Session cannot be cancelled")

    session.status = "cancelled"
    await db.commit()

    return {"status": "cancelled"}


# Duplicate routes for backward compatibility with API gateway routing
@app.get("/interviews/templates")
async def list_templates_interviews(db: AsyncSession = Depends(get_db)):
    return await list_templates(db)

@app.get("/interviews/templates/{template_id}")
async def get_template_interviews(template_id: int, db: AsyncSession = Depends(get_db)):
    return await get_template(template_id, db)

@app.post("/interviews/sessions")
async def create_session_interviews(template_id: int, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await create_session(template_id, current_user, db)

@app.get("/interviews/sessions")
async def list_user_sessions_interviews(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await list_user_sessions(current_user, db)

@app.get("/interviews/sessions/{session_id}")
async def get_session_interviews(session_id: int, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_session(session_id, current_user, db)

@app.put("/interviews/sessions/{session_id}/start")
async def start_session_interviews(session_id: int, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await start_session(session_id, current_user, db)

@app.post("/interviews/sessions/{session_id}/responses")
async def submit_response_interviews(
    session_id: int,
    question_id: int,
    response_data: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    return await submit_response(session_id, question_id, response_data, background_tasks, current_user, db, redis_client)

@app.put("/interviews/sessions/{session_id}/complete")
async def complete_session_interviews(session_id: int, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await complete_session(session_id, current_user, db)