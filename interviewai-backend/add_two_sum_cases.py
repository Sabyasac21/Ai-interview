import random
from pymongo import MongoClient

# connect to the same mongodb instance used by the project
client = MongoClient('mongodb://root:rootpassword@localhost:27017/interviewai?authSource=admin')
db = client.interviewai

q = db.questions.find_one({"title": "Two Sum Problem"})
if not q:
    print("Two Sum question not found in MongoDB")
    exit(1)

print(f"Current test_cases count: {len(q.get('test_cases',[]))}")

# generate additional hidden cases to stress performance
extra = []
for size in [1000, 5000, 10000]:
    arr = [random.randint(-10**6, 10**6) for _ in range(size)]
    # pick two random distinct indices
    i, j = random.sample(range(size), 2)
    target = arr[i] + arr[j]
    extra.append({
        "input": f"nums={arr}, target={target}",
        "expected": f"[{i},{j}]",
        "hidden": True
    })

# also add a worst-case (descending) large array
arr = list(range(10000, 0, -1))
target = arr[0] + arr[1]
extra.append({
    "input": f"nums={arr}, target={target}",
    "expected": "[0,1]",
    "hidden": True
})

result = db.questions.update_one(
    {"title": "Two Sum Problem"},
    {"$push": {"test_cases": {"$each": extra}}}
)
print(f"Added {len(extra)} hidden cases, modified {result.modified_count} document(s)")

q2 = db.questions.find_one({"title": "Two Sum Problem"})
print(f"New test_cases count: {len(q2.get('test_cases',[]))}")
client.close()