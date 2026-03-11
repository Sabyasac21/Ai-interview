# InterviewAI — AI-Powered Interview Practice Platform

An end-to-end interview practice product that simulates real interview environments with AI-driven mock interviews, voice interaction, and skill analytics.

## Highlights
- AI mock interviews with role-based templates
- Voice interview mode (speech-to-text + AI feedback loop)
- Practice system with coding, MCQ, descriptive, and system design
- Skill analytics, streaks, XP, and progress tracking

## Tech Stack
- Frontend: React, Vite, Tailwind CSS
- Backend: FastAPI microservices (API gateway + services)
- Data: MySQL, MongoDB, Redis
- Infra: Docker Compose

## Architecture (High Level)
Frontend → API Gateway → Services
- Practice Service (questions, sessions, submissions)
- Interview Service (mock interview scheduling)
- History/Profile/User Services
- MySQL (metadata), MongoDB (content), Redis (queues/cache)

## Quickstart
### Backend (Docker)
From `interviewai-backend`:
```bash
docker-compose up -d
```

### Frontend
From `Gamified AI Interview Dashboard`:
```bash
npm i
npm run dev
```

Open: `http://localhost:5174`



## Status
Work in progress. Built solo in ~1.5–2 months with ongoing improvements.

