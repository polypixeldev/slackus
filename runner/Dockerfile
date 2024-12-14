FROM node:20

WORKDIR /usr/src/app

COPY . .

RUN apt install libgconf-2-4 libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 libgtk-3-0 libgbm-dev libnss3-dev libxss-dev
RUN corepack enable
RUN pnpm install
RUN npx puppeteer browsers install chrome

CMD ["pnpm", "start"]