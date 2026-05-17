FROM node:20-alpine

WORKDIR /app

COPY package*.json ./ 

RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY src ./src
COPY conf ./conf
COPY tsconfig*.json ./
COPY scripts/ ./scripts/

RUN npm run build

ENV PORT=8080
EXPOSE 8080


CMD npx prisma generate && npx prisma db push && node dist/src/main.js

