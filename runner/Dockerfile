FROM node:20

WORKDIR /usr/src/app

COPY . .

RUN corepack enable
RUN pnpm install

CMD ["pnpm", "start"]