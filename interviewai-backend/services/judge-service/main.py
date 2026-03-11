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
    difficulty: str = "medium"  # easy, medium, hard - for dynamic XP calculation
    hints_used: int = 0


def execute_python_code(code: str, test_cases: list[dict]) -> dict:
    """Execute Python code safely in a subprocess."""
    results = []
    
    for i, test_case in enumerate(test_cases):
        try:
            # Create a wrapper that imports and runs the user's code in a protected context
            wrapper = f"""
import sys
import json

test_input = {json.dumps(test_case.get('input'))}
expected = {json.dumps(test_case.get('expected'))}

try:
    # Parse expected if it's a JSON string (legacy Mongo data)
    if isinstance(expected, str):
        try:
            expected = json.loads(expected)
        except Exception:
            pass
    
    # Execute user code in a separate namespace to isolate it
    user_namespace = {{"__builtins__": __builtins__}}
    exec({repr(code)}, user_namespace)
    
    # Find the user-defined function
    func_to_call = None
    
    # Try common function names in order
    for name in ['solution', 'solve', 'bubbleSort', 'twoSum', 'main']:
        if name in user_namespace and callable(user_namespace[name]):
            func_to_call = user_namespace[name]
            break
    
    if not func_to_call:
        print(json.dumps({{"passed": false, "error": "No solution function found. Define a function like solution(), solve(), or bubbleSort()"}}))
        sys.exit(0)
    
    # Call the function with proper argument handling
    try:
    if isinstance(test_input, dict):
            # If input is a wrapper like {"arr": [...]}, pass the array directly for single-arg functions.
            if len(test_input) == 1 and func_to_call.__code__.co_argcount <= 1:
                only_key = next(iter(test_input.keys()))
                if only_key in ("arr", "array", "nums"):
                    result = func_to_call(test_input[only_key])
                else:
                    try:
                        result = func_to_call(**test_input)
                    except TypeError:
                        result = func_to_call(test_input)
            else:
                # Try unpacking dict as kwargs first, then as single arg
                try:
                    result = func_to_call(**test_input)
                except TypeError:
                    result = func_to_call(test_input)
        elif isinstance(test_input, (list, tuple)):
            # Try unpacking sequence
            try:
                result = func_to_call(*test_input)
            except TypeError:
                result = func_to_call(test_input)
        else:
            # Scalar input
            result = func_to_call(test_input)
        
        # Compare results strictly
        passed = False
        try:
            passed = (result == expected)
        except Exception:
            passed = False
        
        if passed:
            print(json.dumps({{"passed": true, "output": str(result)}}))
        else:
            print(json.dumps({{"passed": false, "output": str(result)}}))
    except Exception as func_error:
        print(json.dumps({{"passed": false, "error": "Function execution error: " + str(func_error)}}))
        
except Exception as e:
    print(json.dumps({{"passed": false, "error": "Code execution error: " + str(e)}}))
"""
            
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
'use strict';

let testInput = {json.dumps(test_input)};
let expected = {json.dumps(test_case.get('expected'))};

// Parse expected if it's a JSON string (legacy Mongo data)
if (typeof expected === 'string') {{
    try {{
        expected = JSON.parse(expected);
    }} catch(e) {{
        // leave as string if not parseable JSON
    }}
}}

try {{
    // Execute user code in a scoped context to capture function definitions
    {extra}
    {code}
    
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
        const keys = Object.keys(testInput);
        if (funcToCall.length <= 1 && keys.length === 1 && (keys[0] === 'arr' || keys[0] === 'array' || keys[0] === 'nums')) {{
            result = funcToCall(testInput[keys[0]]);
        }} else if (funcToCall.length > 1) {{
            result = funcToCall(...Object.values(testInput));
        }} else {{
            result = funcToCall(testInput);
        }}
    }} else if (Array.isArray(testInput)) {{
        // Array input: prefer spread for multi-arg signatures,
        // fallback to single-arg for problems that expect one array param.
        try {{
            if (funcToCall.length > 1) {{
                result = funcToCall(...testInput);
            }} else {{
                result = funcToCall(testInput);
            }}
        }} catch (e) {{
            result = funcToCall(testInput);
        }}
    }} else {{
        // Scalar input
        result = funcToCall(testInput);
    }}
    
    // Strict comparison
    let passed = false;
    let resultStr = JSON.stringify(result);
    let expectedStr = JSON.stringify(expected);
    
    // Handle undefined special case
    if (result === undefined && expected === undefined) {{
        passed = true;
    }} else if (result === null && expected === null) {{
        passed = true;
    }} else if (resultStr === expectedStr) {{
        passed = true;
    }}
    
    if (passed) {{
        console.log(JSON.stringify({{passed: true, output: result}}));
    }} else {{
        console.log(JSON.stringify({{passed: false, output: result}}));
    }}
}} catch (e) {{
    console.log(JSON.stringify({{passed: false, error: e.message + ' (line ' + e.line + ')' }}));
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
'use strict';

let testInput = {json.dumps(test_input)};
let expected = {json.dumps(test_case.get('expected'))};

// Parse expected if it's a JSON string (legacy Mongo data)
if (typeof expected === 'string') {{
    try {{
        expected = JSON.parse(expected);
    }} catch(e) {{
        // leave as string if not parseable JSON
    }}
}}

try {{
    // Execute user code in a scoped context
    {extra}
    {code}
    
    let result;
    let funcToCall = null;
    
    if (typeof solution !== 'undefined') {{
        funcToCall = solution;
    }} else if (typeof solve !== 'undefined') {{
        funcToCall = solve;
    }}
    
    if (!funcToCall) {{
        console.log(JSON.stringify({{passed: false, error: "No solution function found. Define solution() or solve()"}}));
        process.exit(1);
    }}
    
    if (typeof testInput === 'object' && testInput !== null && !Array.isArray(testInput)) {{
        const keys = Object.keys(testInput);
        if (funcToCall.length <= 1 && keys.length === 1 && (keys[0] === 'arr' || keys[0] === 'array' || keys[0] === 'nums')) {{
            result = funcToCall(testInput[keys[0]]);
        }} else if (funcToCall.length > 1) {{
            result = funcToCall(...Object.values(testInput));
        }} else {{
            result = funcToCall(testInput);
        }}
    }} else if (Array.isArray(testInput)) {{
        try {{
            if (funcToCall.length > 1) {{
                result = funcToCall(...testInput);
            }} else {{
                result = funcToCall(testInput);
            }}
        }} catch (e) {{
            result = funcToCall(testInput);
        }}
    }} else {{
        result = funcToCall(testInput);
    }}
    
    let passed = false;
    let resultStr = JSON.stringify(result);
    let expectedStr = JSON.stringify(expected);
    
    if (result === undefined && expected === undefined) {{
        passed = true;
    }} else if (result === null && expected === null) {{
        passed = true;
    }} else if (resultStr === expectedStr) {{
        passed = true;
    }}
    
    if (passed) {{
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
    print(f"⚖️ Judging job {job.job_id}: {job.language}", flush=True)
    print(f"📊 Test cases received: {len(job.test_cases)}", flush=True)
    
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
    
    # Ensure we don't mark as passed if there are no tests
    passed = False
    if total_count > 0:
        passed = (passed_count == total_count)
    
    print(f"📝 Results: {passed_count}/{total_count} passed", flush=True)
    
    # Calculate dynamic XP based on difficulty
    xp_earned = 0
    if passed_count == total_count and total_count > 0:
        difficulty_xp_map = {
            "easy": 25,
            "medium": 50,
            "hard": 100,
        }
        base_xp = difficulty_xp_map.get(job.difficulty.lower(), 50)
        hints_used = max(0, min(3, int(job.hints_used or 0)))
        multiplier = max(0.0, 1.0 - (0.2 * hints_used))
        xp_earned = int(round(base_xp * multiplier))
        print(
            f"💰 XP calculation: difficulty={job.difficulty}, base={base_xp}, hints_used={hints_used}, xp_earned={xp_earned}",
            flush=True,
        )
    
    return {
        "job_id": job.job_id,
        "status": "completed",
        "results": results,
        "passed": passed,
        "testsPassed": passed_count,
        "testsTotal": total_count,
        "score": (passed_count / total_count * 100) if total_count > 0 else 0,
        "xpEarned": xp_earned,
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
                    # preserve code and language from initial submission
                    "code": job.code if hasattr(job, 'code') else "",
                    "language": job.language if hasattr(job, 'language') else "python",
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
