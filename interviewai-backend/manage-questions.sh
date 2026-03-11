#!/bin/bash
# Quick commands for managing question data

echo "🎯 InterviewAI - Data Management Commands"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Docker running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

echo -e "${BLUE}Available Commands:${NC}\n"

echo "1. COUNT QUESTIONS BY CATEGORY"
echo "   docker exec interviewai_mysql mysql -u root -proot rootpassword -e \"SELECT c.name, COUNT(*) as questions FROM interviewai.questions q JOIN interviewai.skill_categories c ON q.category_id = c.id GROUP BY c.id;\""
echo ""

echo "2. LIST ALL QUESTIONS"
echo "   docker exec interviewai_mysql mysql -u root -proot rootpassword -e \"SELECT id, title, difficulty FROM interviewai.questions LIMIT 20;\""
echo ""

echo "3. VERIFY MONGODB DATA"
echo "   docker exec interviewai_mongo mongosh -u root -p rootpassword --eval \"db.getSiblingDB('interviewai').questions.countDocuments()\""
echo ""

echo "4. RESET DATABASES (⚠️  WARNING: Deletes all data)"
echo "   docker-compose down -v && docker-compose up -d"
echo ""

echo "5. VIEW DOCKER LOGS"
echo "   docker-compose logs -f mysql"
echo "   docker-compose logs -f mongodb"
echo ""

echo "6. RUN PYTHON BULK INSERT"
echo "   python bulk-insert.py"
echo ""

echo -e "${GREEN}For detailed instructions, see: ADD_DATA_GUIDE.md${NC}"
