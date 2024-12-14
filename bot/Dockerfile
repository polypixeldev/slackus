FROM node:20

WORKDIR /usr/src/app

COPY . .

WORKDIR /usr/src/app/bot

RUN corepack enable
RUN pnpm install

CMD ["pnpm", "start"]