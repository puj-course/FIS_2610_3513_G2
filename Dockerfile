FROM node:20-alpine

WORKDIR /app

COPY package*.json ./ 

RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY conf ./conf
COPY tsconfig*.json ./

RUN npm run build

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/src/main.js"]
