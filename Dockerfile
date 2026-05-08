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
COPY Scripts ./Scripts

RUN npm run build

ENV PORT=8080
EXPOSE 8080


CMD npx prisma db push && npx ts-node Scripts/insert-recipes.ts && node dist/src/main.js

