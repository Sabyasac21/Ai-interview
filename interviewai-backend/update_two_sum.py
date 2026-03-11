from pymongo import MongoClient

# connect to mongo service inside docker network
client = MongoClient('mongodb://root:rootpassword@interviewai_mongo:27017/interviewai?authSource=admin')
db = client.interviewai

q = db.questions.find_one({"title": "Two Sum Problem"})
if not q:
    print("Two Sum question not found in MongoDB")
    exit(1)

print("before count", len(q.get('test_cases', [])))

extras = [
    {"input": "nums=[1,2,3,4,5], target=9", "expected": "[3,4]", "hidden": True},
    {"input": "nums=[-1,-2,-3,-4,-5], target=-8", "expected": "[2,4]", "hidden": True},
    {"input": "nums=[100000,200000], target=300000", "expected": "[0,1]", "hidden": True},
]

result = db.questions.update_one({"title": "Two Sum Problem"}, {"$push": {"test_cases": {"$each": extras}}})
print("modified count", result.modified_count)

q2 = db.questions.find_one({"title": "Two Sum Problem"})
print("after count", len(q2.get('test_cases', [])))
print("last few cases:", q2.get('test_cases', [])[-4:])
client.close()