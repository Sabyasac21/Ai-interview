from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from datetime import datetime
import os, sys, uuid, asyncio, json, redis
import httpx

sys.path.append("/app/shared")
from database import Base, get_mysql_engine, get_session_factory, get_db_session, get_mongo_client, get_mongo_db
from auth import get_current_user
from models import SkillCategory, UserSkillProgress, Question, PracticeSession

app = FastAPI(title="Practice Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MYSQL_URL = os.getenv("MYSQL_URL", "mysql+aiomysql://root:rootpassword@localhost:3306/interviewai")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://root:rootpassword@localhost:27017/interviewai?authSource=admin")
REDIS_URL = os.getenv("REDIS_URL", "redis://interviewai_redis:6379/0")

engine = get_mysql_engine(MYSQL_URL)
SessionFactory = get_session_factory(engine)
mongo_client = get_mongo_client(MONGO_URL)
mongo_db = get_mongo_db(mongo_client)
redis_client = redis.from_url(REDIS_URL, decode_responses=True)


async def get_db():
    async for session in get_db_session(SessionFactory):
        yield session

def get_mongo():
    return mongo_db


@app.on_event("startup")
async def startup():
    for attempt in range(10):
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
                await conn.run_sync(Base.metadata.create_all)
            print("✅ Connected to MySQL successfully")
            break
        except Exception as e:
            print(f"⏳ MySQL not ready (attempt {attempt + 1}/10): {e}")
            await asyncio.sleep(3)
    await mongo_db.code_submissions.create_index([("session_id", 1)])
    await mongo_db.code_submissions.create_index([("user_id", 1), ("created_at", -1)])

class StartSessionRequest(BaseModel):
    question_id: str


class SubmitAnswerRequest(BaseModel):
    session_id: str
    code: str | None = None
    answer_text: str | None = None
    language: str | None = "python"
    time_spent: int = 0
    hints_used: int = 0


@app.get("/health")
async def health():
    return {"status": "ok", "service": "practice-service"}


@app.get("/categories")
async def list_categories(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = current_user["sub"]
    cats_result = await db.execute(select(SkillCategory))
    categories = cats_result.scalars().all()
    progress_result = await db.execute(select(UserSkillProgress).where(UserSkillProgress.user_id == user_id))
    progress_map = {p.category_id: p for p in progress_result.scalars().all()}
    response = []
    from sqlalchemy import func, distinct

    for cat in categories:
        prog = progress_map.get(cat.id)

        # dynamic total count of *active* questions in this category
        total_query = select(func.count(Question.id)).where(
            Question.category_id == cat.id,
            Question.is_active == True
        )
        total_res = await db.execute(total_query)
        total_count = total_res.scalar() or 0

        # dynamic solved count based on distinct question ids in sessions
        solved_query = select(func.count(distinct(PracticeSession.question_id))).where(
            PracticeSession.user_id == user_id,
            PracticeSession.category_id == cat.id,
            PracticeSession.status == "evaluated",
            PracticeSession.score != None,
            PracticeSession.score > 0,
        )
        solved_res = await db.execute(solved_query)
        solved_count = solved_res.scalar() or 0

        response.append({
            "id": cat.id, "name": cat.name, "slug": cat.slug, "icon": cat.icon,
            "total_questions": total_count, "is_locked": cat.is_locked,
            "questions_solved": solved_count,
            "score_percentage": float(prog.score_percentage) if prog else 0.0,
            "percentile_rank": float(prog.percentile_rank) if prog else 0.0,
            "last_practiced": prog.last_practiced.isoformat() if prog and prog.last_practiced else None,
        })
    return response


@app.get("/questions")
async def list_all_questions(
    limit: int = 100,
    offset: int = 0,
    difficulty: str | None = None,
    category_id: int | None = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all questions with optional filtering by difficulty or category."""
    from sqlalchemy import func
    
    # Build count query
    count_query = select(func.count(Question.id)).where(Question.is_active == True)
    if difficulty:
        count_query = count_query.where(Question.difficulty == difficulty)
    if category_id:
        count_query = count_query.where(Question.category_id == category_id)
    
    count_result = await db.execute(count_query)
    total_count = count_result.scalar() or 0
    
    # Build paginated query
    query = select(Question).where(Question.is_active == True)
    if difficulty:
        query = query.where(Question.difficulty == difficulty)
    if category_id:
        query = query.where(Question.category_id == category_id)
    
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    questions = result.scalars().all()
    
    return {
        "total": total_count,
        "count": len(questions),
        "offset": offset,
        "limit": limit,
        "has_more": (offset + limit) < total_count,
        "data": [
            {
                "id": q.id,
                "title": q.title,
                "difficulty": q.difficulty,
                "type": q.type,
                "category_id": q.category_id,
                "tags": q.tags
            } for q in questions
        ]
    }


@app.get("/categories/{category_id}/questions")
async def list_questions(
    category_id: int, 
    difficulty: str | None = None, 
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    # Get total count
    count_query = select(Question).where(Question.category_id == category_id, Question.is_active == True)
    if difficulty:
        count_query = count_query.where(Question.difficulty == difficulty)
    count_result = await db.execute(count_query)
    total_count = len(count_result.scalars().all())
    
    # Get paginated results
    query = select(Question).where(Question.category_id == category_id, Question.is_active == True)
    if difficulty:
        query = query.where(Question.difficulty == difficulty)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    questions = result.scalars().all()
    
    return {
        "total": total_count,
        "count": len(questions),
        "offset": offset,
        "limit": limit,
        "has_more": (offset + limit) < total_count,
        "data": [{"id": q.id, "title": q.title, "difficulty": q.difficulty, "type": q.type, "tags": q.tags} for q in questions]
    }


@app.get("/categories/{category_id}/solved")
async def get_solved_questions(
    category_id: int, 
    current_user: dict = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Get list of question IDs that user has successfully solved in this category."""
    # Query all sessions where user passed all tests (tests_passed == tests_total)
    result = await db.execute(
        select(PracticeSession).where(
            PracticeSession.user_id == current_user["sub"],
            PracticeSession.category_id == category_id,
            PracticeSession.status == "evaluated",
            PracticeSession.score != None,
            PracticeSession.score > 0,
        )
    )
    sessions = result.scalars().all()
    
    # Extract unique question IDs
    solved_question_ids = list(set(session.question_id for session in sessions))
    
    return {
        "solved_question_ids": solved_question_ids,
        "count": len(solved_question_ids)
    }


@app.get("/questions/{question_id}")
async def get_question(question_id: str, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db), mdb=Depends(get_mongo)):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(404, "Question not found")
    doc = await mdb.questions.find_one({"question_id": question_id})
    hints = (doc.get("hints", []) if doc else [])[:3]
    return {
        "id": question.id, 
        "title": question.title, 
        "difficulty": question.difficulty, 
        "type": question.type,
        "tags": question.tags,
        "description": doc.get("description") if doc else None,
        "examples": doc.get("examples", []) if doc else [],
        "constraints": doc.get("constraints", []) if doc else [],
        "starter_code": doc.get("starter_code", {}) if doc else {},
        "test_cases": doc.get("test_cases", []) if doc else [],
        "hints": hints,
        "options": doc.get("options") if doc else None,
        "correct_answer": doc.get("correct_answer") if doc else None,
    }


@app.post("/sessions/start", status_code=201)
async def start_session(body: StartSessionRequest, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.id == body.question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(404, "Question not found")
    session = PracticeSession(
        id=str(uuid.uuid4()), user_id=current_user["sub"],
        category_id=question.category_id, question_id=body.question_id, status="started",
    )
    db.add(session)
    await db.flush()
    return {"session_id": session.id, "started_at": session.started_at.isoformat()}


@app.post("/sessions/submit")
async def submit_answer(body: SubmitAnswerRequest, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db), mdb=Depends(get_mongo)):
    """Submit code for evaluation. Returns job_id for async polling."""
    # locate session
    result = await db.execute(select(PracticeSession).where(PracticeSession.id == body.session_id, PracticeSession.user_id == current_user["sub"]))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    # Guard against duplicate solved submissions for the same question.
    # This keeps behavior consistent across refresh/non-refresh flows and blocks XP farming.
    solved_in_history = await mdb.session_history.find_one({
        "user_id": current_user["sub"],
        "question_id": session.question_id,
        "$or": [{"passed": True}, {"correct": True}],
    })
    solved_in_session = (
        session.status == "evaluated"
        and session.score is not None
        and float(session.score) > 0
    )
    if solved_in_history or solved_in_session:
        raise HTTPException(409, "Already submitted: this question is already solved.")

    # Allow re-submission: reset session for new attempt
    session.status = "submitted"
    session.time_spent = body.time_spent
    session.score = None
    session.completed_at = None
    await db.flush()

    # Retrieve test cases from mongo and question metadata
    doc = await mdb.questions.find_one({"question_id": session.question_id})
    test_cases = doc.get("test_cases", []) if doc else []
    
    print(f"📋 Fetched question {session.question_id}: found {len(test_cases)} test cases")
    if doc:
        print(f"   Document keys: {list(doc.keys())}")

    # Ensure we have test cases; otherwise we risk auto-passing
    if len(test_cases) == 0:
        print(f"⚠️ No test cases found for question {session.question_id}, rejecting submission")
        raise HTTPException(400, "No test cases available for this question. Please choose a different question or contact support.")

    # Fetch question from DB to get difficulty for XP calculation
    q_result = await db.execute(select(Question).where(Question.id == session.question_id))
    question = q_result.scalar_one_or_none()
    difficulty = question.difficulty if question else "medium"
    
    # Create a judge job and enqueue to Redis
    job_id = str(uuid.uuid4())
    hints_used = max(0, min(3, int(body.hints_used or 0)))
    job_data = {
        "job_id": job_id,
        "code": body.code,
        "language": body.language or "python",
        "test_cases": test_cases,
        "user_id": current_user["sub"],
        "question_id": session.question_id,
        "session_id": body.session_id,
        "difficulty": difficulty,  # Include difficulty for dynamic XP calculation
        "hints_used": hints_used,
    }
    
    # Push to Redis queue
    redis_client.rpush("judge:queue", json.dumps(job_data))
    # Store full job data in hash for later retrieval during claim
    redis_client.hset(f"judge:job:{job_id}", mapping={
        "status": "queued",
        "created_at": datetime.utcnow().isoformat(),
        "code": body.code,
        "language": body.language or "python",
        "session_id": body.session_id,
        "hints_used": str(hints_used),
    })
    
    print(f"📝 Enqueued job {job_id} for session {body.session_id}")
    
    return {
        "job_id": job_id,
        "status": "queued",
        "message": "Submission received. Evaluating...",
    }


@app.get("/judge/{job_id}")
async def get_judge_result(job_id: str, current_user: dict = Depends(get_current_user)):
    """Poll judge job result."""
    job_data = redis_client.hgetall(f"judge:job:{job_id}")
    
    if not job_data:
        raise HTTPException(404, "Job not found")
    
    status = job_data.get("status")
    
    if status == "queued" or status == "processing":
        return {"status": status, "progress": "Evaluating your code..."}
    
    if status == "completed" or status == "error":
        # Parse results
        results = json.loads(job_data.get("results", "[]"))
        return {
            "status": status,
            "results": results,
            "passed": job_data.get("passed") == "True",
            "testsPassed": int(job_data.get("testsPassed", 0)),
            "testsTotal": int(job_data.get("testsTotal", 0)),
            "score": float(job_data.get("score", 0)),
            "xpEarned": int(job_data.get("xpEarned", 0)),
            "completed_at": job_data.get("completed_at"),
        }
    
    return {"status": "unknown"}


@app.post("/judge/{job_id}/claim")
async def claim_judge_result(job_id: str, request: Request, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db), mdb=Depends(get_mongo)):
    """Once user confirms evaluation, claim the result and update session/progress."""
    job_data = redis_client.hgetall(f"judge:job:{job_id}")
    
    print(f"🔍 [CLAIM] Redis job data keys: {list(job_data.keys())}, code_len={len(job_data.get('code', '')) if job_data.get('code') else 0}")
    
    if not job_data or job_data.get("status") != "completed":
        raise HTTPException(400, "Job not ready or not found")

    try:
        # Parse job data
        session_id = job_data.get("session_id")
        if not session_id:
            raise HTTPException(400, "Session ID not found in job")

        # Find session
        result = await db.execute(select(PracticeSession).where(PracticeSession.id == session_id, PracticeSession.user_id == current_user["sub"]))
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(404, "Session not found")

        # Update session with final score (guard conversions)
        passed = job_data.get("passed") == "True"
        try:
            score = float(job_data.get("score", 0) or 0)
        except Exception:
            score = 0.0
        try:
            xp = int(job_data.get("xpEarned", 0) or 0)
        except Exception:
            xp = 0
        try:
            hints_used = int(job_data.get("hints_used", 0) or 0)
        except Exception:
            hints_used = 0

        session.status = "evaluated"
        session.score = score
        session.completed_at = datetime.utcnow()

        # Check if this question was already successfully solved by this user
        prior_solve_result = await db.execute(
            select(PracticeSession).where(
                PracticeSession.user_id == current_user["sub"],
                PracticeSession.question_id == session.question_id,
                PracticeSession.status == "evaluated",
                PracticeSession.score != None,
                PracticeSession.score > 0,
                PracticeSession.id != session.id,  # exclude current session
            )
        )
        prior_session = prior_solve_result.scalars().first()

        # Determine if tests passed in current submission
        tests_passed_count = int(job_data.get("testsPassed", 0) or 0)
        tests_total_count = int(job_data.get("testsTotal", 0) or 0)
        current_tests_passed = tests_passed_count == tests_total_count and tests_total_count > 0
        solved_before_current_claim = await mdb.session_history.find_one({
            "user_id": current_user["sub"],
            "question_id": session.question_id,
            "session_id": {"$ne": session_id},
            "$or": [{"passed": True}, {"correct": True}],
        })

        # Never grant XP again for a question already solved earlier.
        if solved_before_current_claim:
            xp = 0

        # Update user skill progress
        prog_res = await db.execute(select(UserSkillProgress).where(UserSkillProgress.user_id == current_user["sub"], UserSkillProgress.category_id == session.category_id))
        prog = prog_res.scalar_one_or_none()
        if not prog:
            # First time tackling this category: increment only if tests passed
            questions_solved_count = 1 if current_tests_passed else 0
            prog = UserSkillProgress(user_id=current_user["sub"], category_id=session.category_id, questions_solved=questions_solved_count, score_percentage=score if current_tests_passed else 0)
            db.add(prog)
        else:
            # Only increment if: (1) tests passed in current attempt AND (2) no prior successful solve for this question
            if current_tests_passed and not prior_session:
                prog.questions_solved += 1
            # Update score_percentage: average of all solved questions' scores
            if prog.questions_solved > 0:
                prog.score_percentage = float((float(prog.score_percentage) + score) / 2)
            elif current_tests_passed:
                prog.score_percentage = float(score)

        await db.commit()

        # Fetch question and category info for history record
        q_result = await db.execute(select(Question).where(Question.id == session.question_id))
        question = q_result.scalar_one_or_none()
        
        cat_result = await db.execute(select(SkillCategory).where(SkillCategory.id == session.category_id))
        category = cat_result.scalar_one_or_none()
        
        # Record submission to history service (both passed and failed)
        try:
            async with httpx.AsyncClient() as client:
                history_payload = {
                    "user_id": current_user["sub"],
                    "session_id": session_id,
                    "question_id": session.question_id,
                    "question_title": question.title if question else "Unknown",
                    "category_id": session.category_id,
                    "category_slug": category.slug if category else "unknown",
                    "status": "evaluated",
                    "score": score,
                    "passed": passed,
                    "tests_passed": tests_passed_count,
                    "tests_total": tests_total_count,
                    "time_spent": session.time_spent,
                    "xp_earned": xp,
                    "hints_used": hints_used,
                    # include submitted code for editor preload
                    "code": job_data.get("code"),
                    "language": job_data.get("language"),
                }
                print(f"📝 [HISTORY] Recording submission with code length: {len(job_data.get('code', '')) if job_data.get('code') else 0}, language: {job_data.get('language')}")
                history_url = f"{os.getenv('HISTORY_SERVICE_URL','http://interviewai_history:8003')}/history/record"
                print(f"📝 Recording submission to history: {history_url}")
                print(f"   Payload: {history_payload}")
                history_resp = await client.post(history_url, json=history_payload)
                print(f"✅ History response: {history_resp.status_code}")
                if history_resp.status_code != 201:
                    print(f"⚠️ History service returned: {history_resp.text}")
        except Exception as e:
            import traceback
            print(f"❌ Failed to record to history service: {e}")
            traceback.print_exc()

        # Update UTC streak on successful solve.
        # user-service enforces "first successful solve of UTC day" increment semantics.
        if current_tests_passed:
            try:
                auth_header = request.headers.get("authorization")
                user_tz = request.headers.get("x-user-timezone")
                if auth_header:
                    async with httpx.AsyncClient() as client:
                        streak_url = f"{os.getenv('USER_SERVICE_URL','http://interviewai_user:8001')}/users/me/streak/on-success"
                        streak_headers = {"Authorization": auth_header}
                        if user_tz:
                            streak_headers["X-User-Timezone"] = user_tz
                        streak_resp = await client.post(
                            streak_url,
                            headers=streak_headers,
                        )
                        print(f"✅ Streak update response: {streak_resp.status_code}")
                        if streak_resp.status_code != 200:
                            print(f"⚠️ Streak service returned: {streak_resp.text}")
            except Exception as e:
                print(f"⚠️ Failed to update streak on success: {e}")

        # Fetch user info (best-effort)
        user_info = {}
        try:
            async with httpx.AsyncClient() as client:
                user_resp = await client.get(f"{os.getenv('USER_SERVICE_URL','http://interviewai_user:8001')}/users/{current_user['sub']}")
                if user_resp.status_code == 200:
                    user_info = user_resp.json()
        except Exception:
            user_info = {}

        return {
            "status": "claimed",
            "results": json.loads(job_data.get("results", "[]")),
            "passed": passed,
            "testsPassed": int(job_data.get("testsPassed", 0) or 0),
            "testsTotal": int(job_data.get("testsTotal", 0) or 0),
            "score": score,
            "xpEarned": xp,
            "profile": user_info,
        }
    except HTTPException:
        # Re-raise HTTP errors so FastAPI returns the correct status
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to claim job: {e}")


@app.get("/sessions/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db), mdb=Depends(get_mongo)):
    result = await db.execute(select(PracticeSession).where(PracticeSession.id == session_id, PracticeSession.user_id == current_user["sub"]))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    submission = await mdb.code_submissions.find_one({"session_id": session_id})
    return {
        "session_id": session.id, "status": session.status,
        "score": float(session.score) if session.score else None,
        "time_spent": session.time_spent,
        "started_at": session.started_at.isoformat(),
        "completed_at": session.completed_at.isoformat() if session.completed_at else None,
        "submission": {
            "code": submission.get("code") if submission else None,
            "language": submission.get("language") if submission else None,
            "evaluation": submission.get("evaluation") if submission else None,
        },
    }
