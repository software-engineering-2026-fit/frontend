FROM node:22-alpine AS build

WORKDIR /app

RUN npm install --global npm@11

COPY package*.json ./
RUN npm install --no-audit --no-fund --package-lock=true

COPY . .
RUN npm run build

FROM node:22-alpine AS dev

WORKDIR /app

RUN npm install --global npm@11

COPY package*.json ./
RUN npm install --no-audit --no-fund --package-lock=true

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
