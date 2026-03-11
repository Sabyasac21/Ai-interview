import redis
import json
import subprocess
import time
import os
import uuid
import asyncio
import signal
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Any

REDIS_URL = os.getenv("REDIS_URL", "redis://interviewai_redis:6379/0")
TIMEOUT_SECONDS = 5
MEMORY_LIMIT_MB = 256

redis_client = redis.from_url(REDIS_URL, decode_responses=True)


class JudgeJob(BaseModel):
    job_id: str
    code: str
    language: str  # python, javascript, typescript
    test_cases: list[dict]  # [{"input": ..., "expected": ...}, ...]
    user_id: str
    question_id: str
    session_id: str


def execute_python_code(code: str, test_cases: list[dict]) -> dict:
    """Execute Python code safely in a subprocess."""
    results = []
    
    for i, test_case in enumerate(test_cases):
        try:
            # Create a wrapper that imports and runs the user's code
            # provide convenience variable names to match common patterns
            wrapper = f"""
import sys
import json

# User code
{code}

# prepare input variables
test_input = {json.dumps(test_case.get('input'))}
input = test_input
nums = None
target = None
if isinstance(test_input, dict):
    nums = test_input.get('nums')
    target = test_input.get('target')
# if the test input was a string containing variable assignments, try to execute it
if isinstance(test_input, str):
    try:
        exec(test_input)
    except Exception:
        pass
    # after exec we may have populated nums/target; convert to object
    try:
        if nums is not None or target is not None:
            test_input = {"nums": nums, "target": target}
    except NameError:
        pass
            proc = subprocess.run(
                ["python3", "-c", wrapper],
                capture_output=True,
                text=True,
                timeout=TIMEOUT_SECONDS,
            )
            
            if proc.returncode == 0 and proc.stdout:
                result = json.loads(proc.stdout.strip())
                results.append({
                    "passed": result.get("passed", False),
                    "input": test_case.get("input"),
                    "expected": test_case.get("expected"),
                    "actual": result.get("output"),
                    "error": result.get("error"),
                })
            else:
                results.append({
                    "passed": False,
                    "input": test_case.get("input"),
                    "expected": test_case.get("expected"),
                    "error": proc.stderr or "Execution failed",
                })
        except subprocess.TimeoutExpired:
            results.append({
                "passed": False,
                "input": test_case.get("input"),
                "expected": test_case.get("expected"),
                "error": "Time limit exceeded (5s)",
            })
        except Exception as e:
            results.append({
                "passed": False,
                "input": test_case.get("input"),
                "expected": test_case.get("expected"),
                "error": str(e),
            })
    
    return results


def execute_javascript_code(code: str, test_cases: list[dict]) -> dict:
    """Execute JavaScript code safely in a subprocess."""
    results = []
    
    for i, test_case in enumerate(test_cases):
        try:
            # Get input - handle both JSON objects and string representations
            test_input = test_case.get('input')
            if isinstance(test_input, str):
                # Try to parse as JSON object (e.g., {"nums": [2,7,11,15], "target": 9})
                try:
                    test_input = json.loads(test_input)
                except:
                    # If it fails, keep as string - user function should handle it
                    pass
            
            # prepare extra prelude for convenience variables
            extra = ""
            # always provide an `input` shorthand and destructure common names
            extra += "const input = testInput;\n"
            extra += "let nums, target;\n"
            extra += "if (typeof testInput === 'object' && testInput !== null) { ({nums, target} = testInput); }\n"
            # if the raw test input was a string, try to eval it to set variables
            if isinstance(test_input, str):
                safe_str = test_input.replace('`', '\\`')
                extra += f"try {{ eval(`{safe_str}`); }} catch(e) {{}}\n"

            wrapper = f"""
const testInput = {json.dumps(test_input)};
const expected = {json.dumps(test_case.get('expected'))};

{extra}
{code}

try {{
    let result;
    // Try to find and call any function (solution, solve, twoSum, etc.)
    let funcToCall = null;
    
    // Check if 'solution' exists
    if (typeof solution !== 'undefined') {{
        funcToCall = solution;
    }}
    // Check if there's any exported function
    else if (typeof solve !== 'undefined') {{
        funcToCall = solve;
    }}
    
    if (!funcToCall) {{
        console.log(JSON.stringify({{passed: false, error: "No solution function found. Define solution() or solve()"}}));
        process.exit(1);
    }}
    
    // if testInput was a string and our eval populated nums/target, turn it into an object
    if (typeof testInput === 'string') {{
        if (typeof nums !== 'undefined' || typeof target !== 'undefined') {{
            testInput = {{ nums, target }};
        }}
    }}

    // Call function with proper argument unpacking
    if (typeof testInput === 'object' && testInput !== null && !Array.isArray(testInput)) {{
        // Object input - spread as destructured object or pass as first arg
        result = funcToCall(testInput);
    }} else if (Array.isArray(testInput)) {{
        // Array input - spread elements
        result = funcToCall(...testInput);
    }} else {{
        // Scalar input
        result = funcToCall(testInput);
    }}
    
    if (JSON.stringify(result) === JSON.stringify(expected)) {{
        console.log(JSON.stringify({{passed: true, output: result}}));
    }} else {{
        console.log(JSON.stringify({{passed: false, output: result}}));
    }}
}} catch (e) {{
    console.log(JSON.stringify({{passed: false, error: e.message}}));
}}
"""
            
            proc = subprocess.run(
                ["node", "-e", wrapper],
                capture_output=True,
                text=True,
                timeout=TIMEOUT_SECONDS,
            )
            
            if proc.returncode == 0 and proc.stdout:
                result = json.loads(proc.stdout.strip())
                results.append({
                    "passed": result.get("passed", False),
                    "input": test_case.get("input"),
                    "expected": test_case.get("expected"),
                    "actual": result.get("output"),
                    "error": result.get("error"),
                })
            else:
                results.append({
                    "passed": False,
                    "input": test_case.get("input"),
                    "expected": test_case.get("expected"),
                    "error": proc.stderr or "Execution failed",
                })
        except subprocess.TimeoutExpired:
            results.append({
                "passed": False,
                "input": test_case.get("input"),
                "expected": test_case.get("expected"),
                "error": "Time limit exceeded (5s)",
            })
        except Exception as e:
            results.append({
                "passed": False,
                "input": test_case.get("input"),
                "expected": test_case.get("expected"),
                "error": str(e),
            })
    
    return results


def execute_typescript_code(code: str, test_cases: list[dict]) -> dict:
    """Execute TypeScript code safely in a subprocess (compile to JS first)."""
    results = []
    
    for i, test_case in enumerate(test_cases):
        try:
            # Test input parsing
            test_input = test_case.get('input')
            if isinstance(test_input, str):
                try:
                    test_input = json.loads(test_input)
                except:
                    pass
            
            # For simplicity, treat TypeScript as JavaScript (assumes it's valid JS syntax)
            # In production, use ts-node or tsc compiler
            # convenience vars again
            extra = ""
            extra += "const input = testInput;\n"
            extra += "let nums, target;\n"
            extra += "if (typeof testInput === 'object' && testInput !== null) { ({nums, target} = testInput); }\n"
            if isinstance(test_input, str):
                safe_str = test_input.replace('`', '\\`')
                extra += f"try {{ eval(`{safe_str}`); }} catch(e) {{}}\n"

            wrapper = f"""
const testInput = {json.dumps(test_input)};
const expected = {json.dumps(test_case.get('expected'))};

{extra}
{code}

try {{
    let result;
    let funcToCall = null;
    
    if (typeof solution !== 'undefined') {{
        funcToCall = solution;
    }} else if (typeof solve !== 'undefined') {{
        funcToCall = solve;
    }}
    
    if (!funcToCall) {{
        console.log(JSON.stringify({{passed: false, error: "No solution function found"}}));
        process.exit(1);
    }}
    
    if (typeof testInput === 'object' && testInput !== null && !Array.isArray(testInput)) {{
        result = funcToCall(testInput);
    }} else if (Array.isArray(testInput)) {{
        result = funcToCall(...testInput);
    }} else {{
        result = funcToCall(testInput);
    }}
    
    if (JSON.stringify(result) === JSON.stringify(expected)) {{
        console.log(JSON.stringify({{passed: true, output: result}}));
    }} else {{
        console.log(JSON.stringify({{passed: false, output: result}}));
    }}
}} catch (e) {{
    console.log(JSON.stringify({{passed: false, error: e.message}}));
}}
"""
            
            proc = subprocess.run(
                ["node", "-e", wrapper],
                capture_output=True,
                text=True,
                timeout=TIMEOUT_SECONDS,
            )
            
            if proc.returncode == 0 and proc.stdout:
                result = json.loads(proc.stdout.strip())
                results.append({
                    "passed": result.get("passed", False),
                    "input": test_case.get("input"),
                    "expected": test_case.get("expected"),
                    "actual": result.get("output"),
                    "error": result.get("error"),
                })
            else:
                results.append({
                    "passed": False,
                    "input": test_case.get("input"),
                    "expected": test_case.get("expected"),
                    "error": proc.stderr or "Execution failed",
                })
        except subprocess.TimeoutExpired:
            results.append({
                "passed": False,
                "input": test_case.get("input"),
                "expected": test_case.get("expected"),
                "error": "Time limit exceeded (5s)",
            })
        except Exception as e:
            results.append({
                "passed": False,
                "input": test_case.get("input"),
                "expected": test_case.get("expected"),
                "error": str(e),
            })
    
    return results


def judge_submission(job: JudgeJob) -> dict:
    """Execute code and return results."""
    print(f"⚖️ Judging job {job.job_id}: {job.language}")
    
    if job.language == "python":
        results = execute_python_code(job.code, job.test_cases)
    elif job.language in ("javascript", "js"):
        results = execute_javascript_code(job.code, job.test_cases)
    elif job.language in ("typescript", "ts"):
        results = execute_typescript_code(job.code, job.test_cases)
    else:
        return {
            "job_id": job.job_id,
            "status": "error",
            "error": f"Unsupported language: {job.language}",
            "results": [],
        }
    
    passed_count = sum(1 for r in results if r.get("passed"))
    total_count = len(results)
    
    return {
        "job_id": job.job_id,
        "status": "completed",
        "results": results,
        "passed": passed_count == total_count,
        "testsPassed": passed_count,
        "testsTotal": total_count,
        "score": (passed_count / total_count * 100) if total_count > 0 else 0,
        "xpEarned": 50 if passed_count == total_count and total_count > 0 else 0,
    }


def worker_loop():
    """Main worker loop - continuously poll queue and process jobs."""
    print("🚀 Judge worker started", flush=True)
    
    while True:
        try:
            # Block until job available (3 second timeout to check health)
            job_data = redis_client.blpop("judge:queue", timeout=3)
            
            if not job_data:
                continue
            
            _, job_json = job_data
            job_dict = json.loads(job_json)
            job = JudgeJob(**job_dict)
            print(f"📝 Processing job {job.job_id}", flush=True)
            
            # Mark job as processing
            redis_client.hset(f"judge:job:{job.job_id}", mapping={"status": "processing"})
            
            # Execute judgment
            try:
                result = judge_submission(job)
            except Exception as exec_error:
                print(f"❌ Execution error for job {job.job_id}: {exec_error}", flush=True)
                result = {
                    "job_id": job.job_id,
                    "status": "error",
                    "results": [],
                    "passed": False,
                    "testsPassed": 0,
                    "testsTotal": 0,
                    "score": 0,
                    "xpEarned": 0,
                    "error": str(exec_error),
                }
            
            # Store result with expiration (1 hour)
            redis_client.hset(
                f"judge:job:{job.job_id}",
                mapping={
                    "status": result["status"],
                    "results": json.dumps(result.get("results", [])),
                    "passed": str(result.get("passed", False)),
                    "testsPassed": str(result.get("testsPassed", 0)),
                    "testsTotal": str(result.get("testsTotal", 0)),
                    "score": str(result.get("score", 0)),
                    "xpEarned": str(result.get("xpEarned", 0)),
                    "completed_at": datetime.now().isoformat(),
                    "session_id": job.session_id,  # Store session_id for claim endpoint
                    "error": result.get("error", ""),
                }
            )
            redis_client.expire(f"judge:job:{job.job_id}", 3600)
            
            print(f"✅ Job {job.job_id} completed: {result.get('testsPassed', 0)}/{result.get('testsTotal', 0)} passed", flush=True)
            
        except Exception as e:
            print(f"❌ Worker fatal error: {e}", flush=True)
            import traceback
            traceback.print_exc()
            time.sleep(1)


if __name__ == "__main__":
    print("🏃 Starting judge worker...")
    try:
        worker_loop()
    except KeyboardInterrupt:
        print("\n🛑 Judge worker stopped")
