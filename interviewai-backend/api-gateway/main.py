# api-gateway/main.py
# Single entry point. Routes requests to downstream microservices.
# Also handles: CORS, rate limiting placeholder, request logging.

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx, os, logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api-gateway")

app = FastAPI(title="InterviewAI API Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Restrict to your frontend domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Service Registry ─────────────────────────────────────────
SERVICES = {
    "user":        os.getenv("USER_SERVICE_URL",        "http://user-service:8001"),
    "practice":    os.getenv("PRACTICE_SERVICE_URL",    "http://practice-service:8002"),
    "history":     os.getenv("HISTORY_SERVICE_URL",     "http://history-service:8003"),
    "interview":   os.getenv("INTERVIEW_SERVICE_URL",   "http://interview-service:8004"),
    "profile":     os.getenv("PROFILE_SERVICE_URL",     "http://profile-service:8005"),
}

# ─── Route Map ────────────────────────────────────────────────
# Maps gateway path prefixes → target service
ROUTE_MAP = [
    ("/api/auth",         "user"),
    ("/api/users",        "user"),
    ("/api/categories",   "practice"),
    ("/api/questions",    "practice"),
    # Practice session endpoints
    ("/api/sessions",     "practice"),
    # Legacy templates path for interview service
    ("/api/templates",    "interview"),
    ("/api/judge",        "practice"),
    ("/api/history",      "history"),
    ("/api/interviews",   "interview"),
    ("/api/profile",      "profile"),
]


def resolve_service(path: str) -> tuple[str, str] | None:
    for prefix, service_key in ROUTE_MAP:
        if path.startswith(prefix):
            base_url = SERVICES[service_key]
            # Strip /api prefix, keep the rest
            downstream_path = path[len("/api"):]
            return base_url, downstream_path
    return None


@app.get("/health")
async def health():
    return {"status": "ok", "service": "api-gateway", "downstream": list(SERVICES.keys())}


@app.api_route("/api/{path:path}", methods=["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"])
async def proxy(path: str, request: Request):
    full_path = f"/api/{path}"
    resolved = resolve_service(full_path)

    if not resolved:
        raise HTTPException(status_code=404, detail=f"No service found for path: {full_path}")

    base_url, downstream_path = resolved
    target_url = f"{base_url}{downstream_path}"

    # Forward query params
    if request.url.query:
        target_url += f"?{request.url.query}"

    logger.info(f"Proxying {request.method} {full_path} → {target_url}")
    logger.debug(f"Content-Type: {request.headers.get('content-type')}")

    try:
        # Get content type
        content_type = request.headers.get("content-type", "")
        
        # Prepare headers - remove host and keep everything else
        headers = dict(request.headers)
        headers.pop("host", None)
        
        # For multipart/form-data, be especially careful with headers
        if "multipart/form-data" in content_type:
            logger.info(f"Forwarding multipart/form-data request, Content-Type: {content_type}")
            body = await request.body()
            
            # Remove content-length to let httpx recalculate it
            headers.pop("content-length", None)
            
            logger.debug(f"Headers being forwarded: {dict(headers)}")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.request(
                    method=request.method,
                    url=target_url,
                    content=body,
                    headers=headers,
                )
        else:
            # For JSON/form requests, use standard approach
            body = await request.body()
            headers.pop("content-length", None)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.request(
                    method=request.method,
                    url=target_url,
                    content=body,
                    headers=headers,
                )
        
        # Return raw response with headers intact
        # We need to forward binary data (images, etc.) without JSON wrapping.
        headers = {k: v for k, v in resp.headers.items()}
        # Remove hop-by-hop headers that should not be forwarded
        headers.pop("transfer-encoding", None)
        headers.pop("connection", None)

        from fastapi.responses import Response
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            headers=headers,
            media_type=resp.headers.get("content-type"),
        )
    except httpx.ConnectError as e:
        logger.error(f"Service unavailable: {base_url}")
        raise HTTPException(status_code=503, detail=f"Service unavailable: {base_url}")
    except httpx.TimeoutException:
        logger.error(f"Gateway timeout")
        raise HTTPException(status_code=504, detail="Gateway timeout")
    except Exception as e:
        logger.error(f"Error proxying {request.method} {full_path}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Gateway error: {str(e)}")
