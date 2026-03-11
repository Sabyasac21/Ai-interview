import sys
sys.path.append('/app')
import json
from main import judge_submission, JudgeJob

job = JudgeJob(
    job_id='test',
    code='function solution(nums){return 0;}',
    language='javascript',
    test_cases=[
        {"input":{"arr":[5,2,8,1,9]},"expected":[1,2,5,8,9]},
        {"input":{"arr":[1,2,3]},"expected":[1,2,3]},
        {"input":{"arr":[3,2,1]},"expected":[1,2,3]},
        {"input":{"arr":[64,34,25,12,22,11,90]},"expected":[11,12,22,25,34,64,90],"hidden":True}
    ],
    user_id='u1',
    question_id='dsa-10',
    session_id='s1'
)

result = judge_submission(job)
print('Output:', json.dumps(result, indent=2))
