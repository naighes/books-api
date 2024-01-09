FROM node:21.5.0 AS base
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY package*.json ./
RUN npm install
COPY . .
FROM base as builder
WORKDIR /opt/app
RUN npm run build
# FROM node:21.5.0-alpine # TODO: it gets stuck with alpine... :-/
FROM node:21.5.0
WORKDIR /opt/app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /opt/app/.dist ./.dist
COPY src/ .
CMD [ "npm", "run", "start"]
