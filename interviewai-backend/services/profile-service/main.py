from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase
import httpx, os, sys

sys.path.append("/app/shared")
from database import get_mongo_client, get_mongo_db
from auth import get_current_user

app = FastAPI(title="Profile Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MONGO_URL = os.getenv("MONGO_URL", "mongodb://root:rootpassword@localhost:27017/interviewai?authSource=admin")
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:8001")

mongo_client = get_mongo_client(MONGO_URL)
mongo_db = get_mongo_db(mongo_client)

def get_mongo():
    return mongo_db


@app.get("/health")
async def health():
    return {"status": "ok", "service": "profile-service"}


@app.get("/profile/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user), mdb: AsyncIOMotorDatabase = Depends(get_mongo)):
    user_id = current_user["sub"]
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(f"{USER_SERVICE_URL}/users/{user_id}")
        user_data = user_resp.json() if user_resp.status_code == 200 else {}
    pipeline = [
        {"$match": {"user_id": user_id, "status": "evaluated"}},
        {"$group": {"_id": None, "total_sessions": {"$sum": 1}, "avg_score": {"$avg": "$score"}, "total_time_minutes": {"$sum": {"$divide": ["$time_spent", 60]}}}},
    ]
    agg = await mdb.session_history.aggregate(pipeline).to_list(1)
    stats = agg[0] if agg else {"total_sessions": 0, "avg_score": 0, "total_time_minutes": 0}
    notifs = await mdb.notifications.find({"user_id": user_id, "read": False}).sort("created_at", -1).limit(5).to_list(5)
    return {
        "user": user_data,
        "stats": {
            "total_sessions": stats.get("total_sessions", 0),
            "avg_score": round(stats.get("avg_score") or 0, 2),
            "total_time_minutes": round(stats.get("total_time_minutes") or 0, 1),
        },
        "unread_notifications": len(notifs),
        "recent_notifications": [{"type": n.get("type"), "message": n.get("achievement_name", ""), "created_at": n["created_at"].isoformat() if "created_at" in n else None} for n in notifs],
    }


@app.get("/profile/strength")
async def get_profile_strength(current_user: dict = Depends(get_current_user), mdb: AsyncIOMotorDatabase = Depends(get_mongo)):
    pipeline = [
        {"$match": {"user_id": current_user["sub"], "status": "evaluated"}},
        {"$group": {"_id": "$category_slug", "count": {"$sum": 1}, "avg_score": {"$avg": "$score"}}},
    ]
    category_stats = await mdb.session_history.aggregate(pipeline).to_list(20)
    total_categories_active = len(category_stats)
    overall_avg = sum(c["avg_score"] or 0 for c in category_stats) / max(total_categories_active, 1)
    breadth_score = min(total_categories_active * 15, 60)
    quality_score = (overall_avg / 100) * 40
    return {
        "profile_strength": round(breadth_score + quality_score, 1),
        "breakdown": {
            "breadth_score": breadth_score,
            "quality_score": round(quality_score, 1),
            "categories_practiced": total_categories_active,
            "overall_avg_score": round(overall_avg, 1),
        },
    }


@app.get("/profile/settings")
async def get_settings(current_user: dict = Depends(get_current_user), mdb: AsyncIOMotorDatabase = Depends(get_mongo)):
    doc = await mdb.user_settings.find_one({"user_id": current_user["sub"]})
    if not doc:
        return {}
    doc.pop("_id", None)
    doc.pop("user_id", None)
    return doc


@app.patch("/profile/settings")
async def update_settings(payload: dict, current_user: dict = Depends(get_current_user), mdb: AsyncIOMotorDatabase = Depends(get_mongo)):
    user_id = current_user["sub"]
    await mdb.user_settings.update_one({"user_id": user_id}, {"$set": {**payload, "user_id": user_id}}, upsert=True)
    return {"message": "Settings updated"}