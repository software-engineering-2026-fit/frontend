# Nuxt 4 Docker Application

This is a Nuxt 4 application that runs in a production Docker container.
The interface is styled with Tailwind CSS 4.

## Prerequisites

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Docker Compose. Docker Compose Watch requires a recent Docker Compose version; Docker Desktop includes a compatible version.

## Launch the API and frontend

The frontend calls the API directly at `http://localhost:8000`. Start the API first. On first setup, create the API environment file and replace the example database credentials and `SECRET_KEY` with local values:

```powershell
Set-Location ..\api
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Edit .env and set POSTGRES_PASSWORD and a long random SECRET_KEY.
docker compose up --build -d
```

Then, from the frontend project directory, build and start the application:

```powershell
Set-Location ..\frontend
docker compose up --build
```

The application is available at [http://localhost:3000](http://localhost:3000).

The login form sends the email as the OAuth2 `username` field to `/auth/token`, then loads the current user from `/auth/me`. Use **Create an account** on the login page to register through `/auth/register`; after registration, the app signs the new account in. The access token is kept in `sessionStorage` for the current browser tab. Workout plans, exercise selections, and completed-session metrics are stored by the API, not in browser storage. Plans can be created without target metrics. The API allows requests from `http://localhost:3000` and `http://127.0.0.1:3000`.

The running API publishes its current schema at [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json) and interactive documentation at [http://localhost:8000/docs](http://localhost:8000/docs). The workout flow uses `GET/POST /exercises/`, `GET/POST /workouts/`, `GET/POST /workouts/{workout_id}/exercises`, and `GET/POST /workout-logs/`.

## Pages

- `/login` — sign in or create an account through the API.
- `/` — home dashboard with a summary of your workout plans and recent logs.
- `/workouts` — browse workout plans and start a new plan or training session.
- `/workouts/new` — name a plan, select catalog exercises, and create it without setting target metrics.
- `/workouts/:id` — review a plan's exercises and targets.
- `/workouts/:id/log` — record the completed exercises and session date.
- `/calendar` — browse a month-by-month workout history and select a date to log a session.
- `/account` — view your profile and sign out.

Workout plans, exercises, and workout-session logs (including completed-session metrics) are saved through the API. The browser only keeps the authentication token for the current tab.

To start it in the background:

```powershell
docker compose up --build -d
```

Check the container status and health:

```powershell
docker compose ps
```

Follow application logs:

```powershell
docker compose logs -f nuxt
```

Stop and remove the container:

```powershell
docker compose down
```

Stop the API separately from its project directory when finished:

```powershell
Set-Location ..\api
docker compose down
```

## Develop with Compose Watch

Compose Watch rebuilds the container when application source files or configuration change. Start the container in watch mode:

```powershell
docker compose watch
```

The watch configuration monitors changes under `app/`, `public/`, `nuxt.config.ts`, `tsconfig.json`, `package.json`, and `Dockerfile`. Changes trigger a new image build and restart the container.

Press `Ctrl+C` to stop watch mode.

## Run Nuxt without Docker

Install dependencies and start the Nuxt development server locally:

```powershell
npm install
npm run dev
```

The local development server runs at [http://localhost:3000](http://localhost:3000).
The API must be running at [http://localhost:8000](http://localhost:8000), and its CORS configuration must include the frontend origin.

## Useful Nuxt commands

Build the production bundle:

```powershell
npm run build
```

Preview the production bundle locally:

```powershell
npm run preview
```

Learn more in the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction).
