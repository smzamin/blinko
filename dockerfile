FROM node:18-alpine AS build

RUN apk add --no-cache postgresql14-client

WORKDIR /app

COPY package.json pnpm-lock.yaml  ./
COPY prisma ./

RUN npm install pnpm -g

RUN pnpm install

COPY . .

RUN pnpm build
CMD ["sh", "-c", "pnpm migrate && pnpm db-seed && pnpm start"]