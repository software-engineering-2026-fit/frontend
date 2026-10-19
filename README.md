# Nuxt 4 Docker Application

This is a Nuxt 4 application that runs in a production Docker container.

## Prerequisites

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Docker Compose. Docker Compose Watch requires a recent Docker Compose version; Docker Desktop includes a compatible version.

## Launch with Docker Compose

From the project directory, build and start the application:

```powershell
docker compose up --build
```

The application is available at [http://localhost:3000](http://localhost:3000).

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
