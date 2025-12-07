FROM node:20-alpine
WORKDIR /app
COPY package.json .
copy pnpm-lock.yaml .
RUN npm install -g pnpm && pnpm install
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "dev"]