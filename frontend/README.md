# Social AI Automation Frontend

React + Vite frontend for the Social AI Automation app. It handles authentication, brand settings, post generation, approvals, scheduling views, and connected social accounts.

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- Axios
- React Router
- Headless UI
- Lucide React

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run linting:

```bash
npm run lint
```

## Backend API

The frontend uses `VITE_API_BASE_URL` for API requests. For local development it falls back to:

```text
http://localhost:8000
```

Create `.env.local` for local overrides:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Deployment Notes

- Deploy the contents of this `frontend` folder as the frontend repository.
- Build command: `npm run build`
- Output directory: `dist`
- On Vercel, set `VITE_API_BASE_URL` to your Render backend URL.
- Make sure the backend deployment allows CORS from the Vercel frontend domain.
