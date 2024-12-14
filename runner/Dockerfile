FROM node:20

WORKDIR /usr/src/app

COPY . .

RUN corepack enable
RUN pnpm install
RUN npx puppeteer browsers install chrome

CMD ["pnpm", "start"]