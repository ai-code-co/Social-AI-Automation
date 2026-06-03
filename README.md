# Social AI Automation

Social AI Automation is a multi-business social media content dashboard that uses AI to generate, organize, and manage platform-specific posts with separate brand memory, default topics, and posting preferences for each business.

## Features

- Manage multiple businesses or pages from one workspace
- Store separate brand memory for each business
- Configure default content topics, hashtags, tone, audience, and brand voice
- Choose enabled platforms per business, such as Instagram, Facebook, LinkedIn, TikTok, YouTube, and Twitter
- Generate single posts with AI
- Generate batch posts from each business's default topics
- Review, approve, pause, and delete posts
- Light and dark UI themes

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, lucide-react
- Backend: FastAPI, SQLAlchemy, PostgreSQL
- AI: OpenAI API
- Scheduler: APScheduler

## Project Structure

```text
social-ai-automation/
  backend/
    app/
      models/
      routes/
      services/
      tasks/
    requirements.txt
  frontend/
    src/
      components/
    package.json
  .env
```

## Environment Variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/social_ai
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your_secret_key
DEBUG=true
```

## Backend Setup

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.db_init
uvicorn app.main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Useful Commands

Build frontend:

```powershell
cd frontend
npm run build
```

Run backend import check:

```powershell
cd backend
.\venv\Scripts\python.exe -c "from app.main import app; print('backend import ok')"
```

Initialize or update database tables:

```powershell
cd backend
.\venv\Scripts\python.exe -m app.db_init
```

## Notes

The app currently generates and manages social posts, but direct publishing to social media platform APIs is not implemented yet. Scheduled publishing can be added later by connecting platform APIs and running a publisher job for due posts.
