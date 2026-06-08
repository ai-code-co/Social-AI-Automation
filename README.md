# Social AI Automation

Social AI Automation is a multi-business social media content dashboard that uses AI to generate, organize, and manage platform-specific posts with separate brand memory, default topics, and posting preferences for each business.

## Features

- Manage multiple businesses or pages from one workspace
- Store separate brand memory for each business
- Configure default content topics, hashtags, tone, audience, and brand voice
- Choose enabled platforms per business, such as Instagram, Facebook, LinkedIn, and Twitter
- Generate single posts with AI
- Generate post images from the AI-created image prompts
- Generate batch posts from each business's default topics
- Connect Facebook Page and Instagram Business accounts for scheduled publishing
- Review, approve, pause, and delete posts
- Light and dark UI themes

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, lucide-react
- Backend: FastAPI, SQLAlchemy, PostgreSQL
- AI: OpenAI API for captions, Pollinations for development image generation
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
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
IMAGE_GENERATION_ENABLED=true
IMAGE_PROVIDER=pollinations
POLLINATIONS_API_KEY=your_free_pollinations_api_key
IMAGE_MODEL=flux
IMAGE_SIZE=1024x1024
IMAGE_ENHANCE=false
IMAGE_SAFE=true
PUBLIC_APP_URL=https://your-public-app-url.example.com
META_GRAPH_VERSION=v24.0
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:8000/social-accounts/meta/callback
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:8000/social-accounts/instagram/callback
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:8000/social-accounts/linkedin/callback
LINKEDIN_VERSION=202602
X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret
X_REDIRECT_URI=http://localhost:8000/social-accounts/x/callback
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

Scheduled publishing currently supports Facebook Pages, Instagram Business accounts, LinkedIn profiles, and X profiles. Meta, LinkedIn, and X can be connected with OAuth from the Social tab, with manual token setup available as a fallback. The scheduler checks for due posts every minute and publishes posts with `scheduled` status.

Instagram image publishing requires `PUBLIC_APP_URL` so Meta can fetch the generated image over public HTTPS. Facebook posts can publish as text-only if no public image URL is configured.
