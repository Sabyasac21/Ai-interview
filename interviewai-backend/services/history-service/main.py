from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
import os, sys
from zoneinfo import ZoneInfo

sys.path.append("/app/shared")
from database import get_mongo_client, get_mongo_db
from auth import get_current_user

app = FastAPI(title="History Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MONGO_URL = os.getenv("MONGO_URL", "mongodb://root:rootpassword@localhost:27017/interviewai?authSource=admin")
mongo_client = get_mongo_client(MONGO_URL)
mongo_db = get_mongo_db(mongo_client)

def get_mongo():
    return mongo_db


@app.on_event("startup")
async def startup():
    # existing indexes help queries by user and category
    await mongo_db.session_history.create_index([("user_id", 1), ("created_at", -1)])
    await mongo_db.session_history.create_index([("user_id", 1), ("category_slug", 1)])
    # new index to quickly look up the latest submission for a question
    await mongo_db.session_history.create_index([("user_id", 1), ("question_id", 1), ("created_at", -1)])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "history-service"}


@app.get("/history")
async def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: str | None = None,
    status: str | None = None,
    question_id: str | None = None,
    current_user: dict = Depends(get_current_user),
    mdb: AsyncIOMotorDatabase = Depends(get_mongo),
):
    user_id = current_user["sub"]
    query: dict = {"user_id": user_id}
    if category:
        query["category_slug"] = category
    if status:
        query["status"] = status
    if question_id:
        query["question_id"] = question_id
        # when filtering by question it's common to only want the latest
        # so client can pass limit=1, but we don't force it here.
    skip = (page - 1) * limit
    total = await mdb.session_history.count_documents(query)
    cursor = mdb.session_history.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    serialized = [_serialize(d) for d in docs]
    if question_id and docs:
        print(f"📤 [HISTORY] GET /history?question_id={question_id} returning {len(serialized)} docs, first has code_len={len(serialized[0].get('code', '')) if serialized[0].get('code') else 0}")
    return {
        "total": total, "page": page, "limit": limit,
        "pages": (total + limit - 1) // limit,
        "results": serialized,
    }


@app.get("/history/stats/summary")
async def get_stats_summary(current_user: dict = Depends(get_current_user), mdb: AsyncIOMotorDatabase = Depends(get_mongo)):
    pipeline = [
        {"$match": {"user_id": current_user["sub"], "status": "evaluated"}},
        {"$group": {"_id": "$category_slug", "total_sessions": {"$sum": 1}, "avg_score": {"$avg": "$score"}, "total_time": {"$sum": "$time_spent"}}},
        {"$sort": {"total_sessions": -1}},
    ]
    results = await mdb.session_history.aggregate(pipeline).to_list(100)
    return {"category_stats": results}


@app.get("/history/stats/latest-success-day")
async def get_latest_success_day(
    timezone_name: str = Query("UTC", alias="timezone"),
    current_user: dict = Depends(get_current_user),
    mdb: AsyncIOMotorDatabase = Depends(get_mongo),
):
    """
    Returns latest successful submission day in UTC (YYYY-MM-DD).
    Success = evaluated + (passed/correct true OR score > 0 OR full tests passed).
    """
    doc = await mdb.session_history.find_one(
        {
            "user_id": current_user["sub"],
            "status": "evaluated",
            "$or": [
                {"passed": True},
                {"correct": True},
                {"score": {"$gt": 0}},
                {"$expr": {"$and": [{"$gt": ["$tests_total", 0]}, {"$eq": ["$tests_passed", "$tests_total"]}]}}
            ],
        },
        sort=[("created_at", -1)],
    )
    if not doc:
        return {"latest_success_day_utc": None, "latest_success_day": None, "timezone": timezone_name}

    created = doc.get("created_at")
    if isinstance(created, datetime):
        created_dt = created if created.tzinfo else created.replace(tzinfo=timezone.utc)
    elif isinstance(created, str):
        parsed = created.strip()
        if parsed.endswith("Z"):
            parsed = parsed.replace("Z", "+00:00")
        try:
            created_dt = datetime.fromisoformat(parsed)
            if created_dt.tzinfo is None:
                created_dt = created_dt.replace(tzinfo=timezone.utc)
        except Exception:
            created_dt = datetime.now(timezone.utc)
    else:
        created_dt = datetime.now(timezone.utc)

    try:
        tzinfo = ZoneInfo(timezone_name)
    except Exception:
        timezone_name = "UTC"
        tzinfo = timezone.utc

    return {
        "latest_success_day_utc": created_dt.astimezone(timezone.utc).date().isoformat(),
        "latest_success_day": created_dt.astimezone(tzinfo).date().isoformat(),
        "timezone": timezone_name,
    }


@app.get("/history/{session_id}")
async def get_history_detail(session_id: str, current_user: dict = Depends(get_current_user), mdb: AsyncIOMotorDatabase = Depends(get_mongo)):
    doc = await mdb.session_history.find_one({"session_id": session_id, "user_id": current_user["sub"]})
    if not doc:
        raise HTTPException(404, "Session not found")
    return _serialize(doc)


@app.post("/history/record", status_code=201)
async def record_session(payload: dict, mdb: AsyncIOMotorDatabase = Depends(get_mongo)):
    payload["created_at"] = datetime.utcnow()
    print(f"📥 [HISTORY] Record received: code_len={len(payload.get('code', '')) if payload.get('code') else 0}, language={payload.get('language')}")
    result = await mdb.session_history.insert_one(payload)
    return {"inserted_id": str(result.inserted_id)}


def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    if "created_at" in doc and isinstance(doc["created_at"], datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc
