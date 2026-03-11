import asyncio
import sys
sys.path.append("/app/shared")
from database import get_mysql_engine, get_session_factory, get_db_session
from models import InterviewTemplate, InterviewQuestion
from sqlalchemy import text

MYSQL_URL = "mysql+aiomysql://root:rootpassword@localhost:3306/interviewai"

async def seed_data():
    engine = get_mysql_engine(MYSQL_URL)
    SessionFactory = get_session_factory(engine)

    async with SessionFactory() as session:
        # Create tables
        from database import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Check if data already exists
        result = await session.execute(text("SELECT COUNT(*) FROM interview_templates"))
        count = result.scalar()
        if count > 0:
            print("Data already seeded")
            return

        # Create interview templates
        templates = [
            InterviewTemplate(
                title="Software Engineer Interview",
                description="Comprehensive interview for software engineering positions",
                company="TechCorp",
                difficulty="Medium",
                duration_minutes=45,
                question_count=8,
                categories=["technical", "behavioral"]
            ),
            InterviewTemplate(
                title="Frontend Developer Interview",
                description="Focus on frontend technologies and user experience",
                company="WebSolutions",
                difficulty="Easy",
                duration_minutes=30,
                question_count=6,
                categories=["frontend", "javascript", "react"]
            ),
            InterviewTemplate(
                title="Full Stack Developer Interview",
                description="Complete assessment of full-stack development skills",
                company="InnovateLabs",
                difficulty="Hard",
                duration_minutes=60,
                question_count=12,
                categories=["backend", "frontend", "database", "system-design"]
            )
        ]

        for template in templates:
            session.add(template)
        await session.commit()

        # Get template IDs
        template_result = await session.execute(text("SELECT id, title FROM interview_templates"))
        template_map = {row[1]: row[0] for row in template_result}

        # Create questions
        questions_data = [
            # Software Engineer Interview
            (template_map["Software Engineer Interview"], [
                ("Tell me about yourself and your experience.", "behavioral", 120, ["Focus on relevant experience", "Keep it under 2 minutes"]),
                ("Explain the difference between let, const, and var in JavaScript.", "technical", 180, ["Scope differences", "Hoisting behavior", "Best practices"]),
                ("How would you optimize a React application?", "technical", 240, ["Code splitting", "Memoization", "Bundle analysis"]),
                ("Describe the MVC architecture pattern.", "technical", 180, ["Model-View-Controller", "Separation of concerns", "Data flow"]),
                ("How do you handle state management in a large application?", "technical", 240, ["Redux/Context API", "State lifting", "Performance considerations"]),
                ("Explain RESTful API design principles.", "technical", 180, ["HTTP methods", "Resource naming", "Status codes"]),
                ("How would you approach debugging a production issue?", "behavioral", 180, ["Systematic approach", "Logging", "Monitoring"]),
                ("What are your thoughts on testing and code quality?", "technical", 180, ["Unit testing", "Integration testing", "Code review"])
            ]),
            # Frontend Developer Interview
            (template_map["Frontend Developer Interview"], [
                ("Walk me through your resume and experience.", "behavioral", 120, ["Highlight frontend skills", "Project examples"]),
                ("Explain CSS Box Model.", "technical", 150, ["Content, padding, border, margin", "Box-sizing property"]),
                ("How does React's virtual DOM work?", "technical", 180, ["Reconciliation", "Diffing algorithm", "Performance benefits"]),
                ("Describe responsive design techniques.", "technical", 180, ["Media queries", "Flexbox/Grid", "Mobile-first approach"]),
                ("How do you handle browser compatibility?", "technical", 150, ["Polyfills", "Feature detection", "Progressive enhancement"]),
                ("Explain event delegation in JavaScript.", "technical", 150, ["Event bubbling", "Performance optimization", "Dynamic elements"])
            ]),
            # Full Stack Developer Interview
            (template_map["Full Stack Developer Interview"], [
                ("Describe your development workflow.", "behavioral", 120, ["Version control", "Code review", "Deployment"]),
                ("Explain database normalization.", "technical", 180, ["Normal forms", "Relationships", "Performance trade-offs"]),
                ("How do you secure a web application?", "technical", 240, ["Authentication", "Authorization", "Common vulnerabilities"]),
                ("Describe microservices architecture.", "system_design", 300, ["Service boundaries", "Communication", "Scalability"]),
                ("How would you design a scalable API?", "system_design", 300, ["Rate limiting", "Caching", "Load balancing"]),
                ("Explain asynchronous programming in JavaScript.", "technical", 180, ["Promises", "Async/await", "Event loop"]),
                ("How do you handle database migrations?", "technical", 150, ["Version control", "Rollback strategy", "Data integrity"]),
                ("Describe your approach to code refactoring.", "behavioral", 180, ["When to refactor", "Testing", "Incremental changes"]),
                ("How would you optimize database queries?", "technical", 240, ["Indexing", "Query analysis", "Caching strategies"]),
                ("Explain containerization and Docker.", "technical", 180, ["Images vs containers", "Dockerfile", "Orchestration"]),
                ("How do you implement error handling?", "technical", 180, ["Try-catch", "Error boundaries", "Logging"]),
                ("What are your thoughts on DevOps practices?", "behavioral", 180, ["CI/CD", "Infrastructure as code", "Monitoring"])
            ])
        ]

        for template_id, questions in questions_data:
            for i, (question, q_type, time_limit, hints) in enumerate(questions):
                q = InterviewQuestion(
                    template_id=template_id,
                    question=question,
                    question_type=q_type,
                    time_limit_seconds=time_limit,
                    hints=hints,
                    order_index=i + 1
                )
                session.add(q)

        await session.commit()
        print("✅ Interview data seeded successfully")

if __name__ == "__main__":
    asyncio.run(seed_data())