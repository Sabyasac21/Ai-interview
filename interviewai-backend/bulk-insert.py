#!/usr/bin/env python3
"""
Bulk insert questions into MySQL and MongoDB
Run this script after Docker containers are running
"""

import json
import sys
import aiomysql
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Database connection details
MYSQL_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'rootpassword',
    'db': 'interviewai',
}

MONGO_URL = 'mongodb://root:rootpassword@localhost:27017/interviewai?authSource=admin'

# Sample questions data
QUESTIONS_DATA = [
    {
        'mysql': {
            'id': 'react-1',
            'category_id': 1,
            'title': 'Create a Simple Counter Component',
            'difficulty': 'easy',
            'tags': ['useState', 'Events', 'Components']
        },
        'mongodb': {
            'question_id': 'react-1',
            'title': 'Create a Simple Counter Component',
            'type': 'coding',
            'description': 'Create a React component that displays a counter with increment and decrement buttons.',
            'examples': [
                {
                    'input': 'Initial render',
                    'output': 'Counter displays 0',
                    'explanation': 'The counter starts at 0'
                }
            ],
            'starter_code': {
                'javascript': 'function Counter() { return <div></div>; }',
                'typescript': 'const Counter: React.FC = () => { return <div></div>; };'
            },
            'test_cases': [
                {'input': 'increment clicked', 'expected': '1', 'hidden': False},
                {'input': 'decrement clicked', 'expected': '-1', 'hidden': True}
            ],
            'solution': 'const [count, setCount] = useState(0);',
            'solution_explanation': 'Use useState hook to manage counter state'
        }
    },
    {
        'mysql': {
            'id': 'js-1',
            'category_id': 2,
            'title': 'Array Filter Method',
            'difficulty': 'easy',
            'tags': ['Array', 'Methods', 'Functional Programming']
        },
        'mongodb': {
            'question_id': 'js-1',
            'title': 'Array Filter Method',
            'type': 'coding',
            'description': 'Filter an array to only include numbers greater than 5',
            'examples': [
                {
                    'input': '[1, 3, 5, 7, 9]',
                    'output': '[7, 9]',
                    'explanation': 'Only 7 and 9 are greater than 5'
                }
            ],
            'starter_code': {
                'javascript': 'function filterGreaterThanFive(arr) { }',
                'python': 'def filter_greater_than_five(arr): pass'
            },
            'test_cases': [
                {'input': '[1,3,5,7,9]', 'expected': '[7,9]', 'hidden': False},
                {'input': '[10,2,8]', 'expected': '[10,8]', 'hidden': False}
            ],
            'solution': 'return arr.filter(num => num > 5);',
            'solution_explanation': 'Use filter() with a predicate function'
        }
    },
    {
        'mysql': {
            'id': 'dsa-1',
            'category_id': 4,
            'title': 'Two Sum Problem',
            'difficulty': 'easy',
            'tags': ['Hash Map', 'Array', 'Classic']
        },
        'mongodb': {
            'question_id': 'dsa-1',
            'title': 'Two Sum Problem',
            'type': 'coding',
            'description': 'Given an array and target sum, return indices of two numbers that add to target',
            'examples': [
                {
                    'input': 'nums=[2,7,11,15], target=9',
                    'output': '[0,1]',
                    'explanation': 'nums[0] + nums[1] = 2 + 7 = 9'
                }
            ],
            'constraints': ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
            'starter_code': {
                'javascript': 'function twoSum(nums, target) { }',
                'python': 'def two_sum(nums, target): pass'
            },
            'test_cases': [
                {'input': 'nums=[2,7,11,15],target=9', 'expected': '[0,1]', 'hidden': False},
                {'input': 'nums=[3,2,4],target=6', 'expected': '[1,2]', 'hidden': False}
            ],
            'solution': 'Use hash map to store seen values and find complement',
            'solution_explanation': 'For each num, check if complement exists in map. Time: O(n), Space: O(n)'
        }
    }
]


async def insert_mysql(questions_data):
    """Insert questions into MySQL"""
    conn = await aiomysql.connect(**MYSQL_CONFIG)
    cursor = await conn.cursor()
    
    try:
        for q in questions_data:
            mysql_data = q['mysql']
            tags_json = json.dumps(mysql_data['tags'])
            
            await cursor.execute(
                '''INSERT INTO questions (id, category_id, title, difficulty, tags, is_active)
                   VALUES (%s, %s, %s, %s, %s, TRUE)
                   ON DUPLICATE KEY UPDATE title=VALUES(title), difficulty=VALUES(difficulty)''',
                (
                    mysql_data['id'],
                    mysql_data['category_id'],
                    mysql_data['title'],
                    mysql_data['difficulty'],
                    tags_json
                )
            )
        
        await conn.commit()
        print(f'✅ Inserted {len(questions_data)} questions into MySQL')
    except Exception as e:
        print(f'❌ MySQL error: {e}')
    finally:
        await cursor.close()
        conn.close()


async def insert_mongodb(questions_data):
    """Insert questions into MongoDB"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['interviewai']
    
    try:
        for q in questions_data:
            mongodb_data = q['mongodb']
            mongodb_data['created_at'] = datetime.utcnow()
            mongodb_data['updated_at'] = datetime.utcnow()
            
            await db.questions.update_one(
                {'question_id': mongodb_data['question_id']},
                {'$set': mongodb_data},
                upsert=True
            )
        
        print(f'✅ Inserted {len(questions_data)} questions into MongoDB')
    except Exception as e:
        print(f'❌ MongoDB error: {e}')
    finally:
        client.close()


async def main():
    """Main function"""
    print('🚀 Starting bulk insert...\n')
    
    await insert_mysql(QUESTIONS_DATA)
    await insert_mongodb(QUESTIONS_DATA)
    
    print('\n✨ Bulk insert completed!')
    print('📊 Verify with:')
    print('   MySQL: SELECT COUNT(*) FROM questions;')
    print('   MongoDB: db.questions.countDocuments()')


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('\n⚠️  Operation cancelled')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Error: {e}')
        sys.exit(1)
